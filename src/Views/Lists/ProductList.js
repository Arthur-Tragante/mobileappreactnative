import LottieView from 'lottie-react-native';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import * as Actions from '../../Redux/actions';
import React from 'react';
import { View, Alert, FlatList, Vibration, ScrollView, RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import viewActions from '../ViewActions';
import {
  Tabs,
  Tab,
  TabHeading,
  Icon,
  ListItem,
  Label,
  Left,
  Right,
} from 'native-base';
import tabStyles from '../../styles/Tabs';
import cameraStyles from '../../styles/Camera';
import { RNCamera } from 'react-native-camera';
import defaultStyles from '../../styles';
import masterApi from '../../services/MasterApi';
import { formataRealString, sortList, acaoPermitida } from '../../utils';
import marginStyles from '../../styles/margin';
import animationStyles from '../../styles/Animations';
import localStorage from '../../services/LocalStorage';
import toastWrapper from '../../services/ToastWrapper';
import dataStorage from '../../services/DataStorage';

class ProductList extends React.Component {
  constructor(props) {
    super(props);

    this.previousQuery = '';
    this.typingTimer = null;

    this.state = {
      products: [],
      filteredProducts: [],
      isRefreshing: false,
      cameraEnabled: false,
      // didUpdate: false,
      index: 0,
      insertFromSubmit: false,
      selectFromSubmit: false,
      naoMostrarPrecoDeCusto: false,
    };
  }

  disabled = false;

  static propTypes = {
    activeRoute: PropTypes.shape({
      name: PropTypes.string.isRequired,
      screen: PropTypes.any.isRequired,
      icon: PropTypes.string,
    }).isRequired,
    routes: PropTypes.arrayOf(PropTypes.object).isRequired,
    goBack: PropTypes.func.isRequired,
    navigateTo: PropTypes.func.isRequired,
  };
  

  async componentDidMount() {
    await this.onRefresh();
    await this.CarregaConfiguracoes(); 
  }

  async CarregaConfiguracoes() {
    const naoMostrarPrecoDeCusto = await acaoPermitida('PR_NAO_MOSTRAR_CUSTO');

    this.setState({
      naoMostrarPrecoDeCusto
    })
  }

  onRefresh = async () => {
    
      this.setState({
        isRefreshing: true,
      });

      await this.loadProductsAsync();

      setTimeout(() => {
        this.setState({
          isRefreshing: false,
        });
      }, 1500);
  };

  componentDidUpdate() {
    if (this.previousQuery != this.props.query) {
      // this.handleSearch(this.props.query);
      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.handleSearch(this.props.query, this.props.querySubmit);
      }, 1000);
    }
    this.previousQuery = this.props.query;

    if(this.state.insertFromSubmit) {
      this.setState({
        insertFromSubmit: false
      })
      this.props.goBack();
    }

    if(this.state.selectFromSubmit) {
      this.setState({
        selectFromSubmit: false
      })
      this.props.navigateTo('Produto');
    }    
    
  }

  componentWillUnmount() {
    if (this.camera) {
      this.camera.pausePreview();
    }

    this.setState({
      cameraEnabled: false,
    });
  }

  async handleProductsSync(storedProducts) {
    toastWrapper.showToast('Sincronizando produtos...');
    let hasErrors = false;
    if (this.refreshingManually) {
      hasErrors = await masterApi.getProdutosFilaAsync(storedProducts);
    }

    this.refreshingManually = false;

    this.setState({
      filteredProducts: this.filterActiveProducts(storedProducts, false),
      products: storedProducts
    });
    if (hasErrors) {
      toastWrapper.showToast('Erro na sincronização de produtos.');
    } else {
      toastWrapper.showToast('Produtos sincronizados.');
    }
  }

  async handleStocksSync(storedProducts) {
    let hasErrors = await masterApi.getEstoquesFilaAsync(storedProducts);

    this.setState({
      filteredProducts: this.filterActiveProducts(storedProducts, false),
      products: storedProducts,
    });

    if (hasErrors) {
      toastWrapper.showToast('Erro na sincronização de estoques.');
    } else {
      toastWrapper.showToast('Estoques sincronizados.');
    }
  }

  async handlePricesSync(storedProducts) {
    let hasErrors = await masterApi.getPrecosFilaAsync(storedProducts);

    this.setState({
      filteredProducts: this.filterActiveProducts(storedProducts, false),
      products: storedProducts,
    });

    if (hasErrors) {
      toastWrapper.showToast('Erro na sincronização de preços.');
    } else {
      toastWrapper.showToast('Preços sincronizados.');
    }
  }

  async loadProductsAsync() {
    const productSyncActive = parseInt(
      await localStorage.getValueAsync('app.productSyncActive')
    );

    if (productSyncActive) {
      setTimeout(() => {
        toastWrapper.showToast(
          'Aguarde, seus produtos estão sincronizando...'
        );
      }, 1000);

      return;
    }

    let storedProducts = (await dataStorage.getStoredProductsAsync()) || [];

    await this.handleProductsSync(storedProducts);

    setTimeout(async () => {
      await this.handleStocksSync(storedProducts);
      await this.handlePricesSync(storedProducts);
    }, 1000);

  }

  handleSearch = (query, querySubmit=false) => {
    const { setProduct, setViewAction, viewAction, viewActionPai } = this.props;
    if (!query) {
      this.setState({
        filteredProducts: this.filterActiveProducts(this.state.products, false)
      });
      return;
    }

    const queryLowered = query.toLowerCase();
    let filteredProducts = [];

    this.state.products.forEach(value => {
      if (
        (value.Referencia || '').toLowerCase() != queryLowered &&
        (value.Nome || '').toLowerCase() != queryLowered &&
        (value.Codigo || '') != queryLowered &&
        (value.EAN || '') != queryLowered
      ) {
        return;
      }

      filteredProducts.push(value);
    });

    if (filteredProducts.length == 0) {
      this.state.products.forEach(value => {
        if (
          !(value.Referencia || '').toLowerCase().includes(queryLowered) &&
          !(value.Nome || '').toLowerCase().includes(queryLowered)
        ) {
          return;
        }

        filteredProducts.push(value);
      });
    }

    this.setState({
      filteredProducts: this.filterActiveProducts(filteredProducts, true),
    });

    if(filteredProducts.length == 1 && querySubmit) {
      let item = filteredProducts[0];
      if (viewAction == viewActions.selecting) {
        if (item.ControlaEstoque && item.EstoqueAtual <= 0) {
          setProduct(null);
          Alert.alert(
            'Produto sem estoque',
            'Este produto não possui estoque disponível.',
            [
              {
                text: 'Ok',
              },
            ],
            {
              cancelable: false,
            }
          );
          return;
        }
        viewActionPai == viewActions.creating ?
          setViewAction(viewActions.creating)
          : (viewActionPai == viewActions.editing ?
            setViewAction(viewActions.editing)
            : null);
          setProduct(JSON.parse(JSON.stringify(item)));
          this.setState({
          insertFromSubmit: true
        });
      } else {
        setViewAction(viewActions.viewing);
        this.setState({
          selectFromSubmit: true
        });
      }
    }
  }

  filterActiveProducts(filteredProducts, searching) {   
    let result = filteredProducts.filter(p => {
      if (searching) {
        return p.TokenAtivo == true && p.Ativo == true;  
      } else
        return p.TokenAtivo == true && p.Ativo == true && p.EstoqueAtual > 0;    
    });

    return result;
  }

  render() {
    const {
      viewAction,
      viewActionPai,
      setViewAction,
      goBack,
      navigateTo,
      setProduct,
    } = this.props;
    const { filteredProducts } = this.state;

    return (
      <View style={{ flex: 1 }}>
        <Tabs
          page={this.state.index}
          onChangeTab={tab => {
            this.setState({
              cameraEnabled: tab.i == 1,
              index: tab.i,
            });

            if (tab.i != 1 && this.camera != undefined) {
              this.camera.stopRecording();
              this.setState({
                cameraEnabled: false,
              });
            }
          }}
        >
          <Tab
            activeTabStyle={tabStyles.tabs}
            textStyle={tabStyles.tabsText}
            tabStyle={tabStyles.tabs}
            heading="Produtos"
          >
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={ () => {
                    this.refreshingManually = true;
                    this.onRefresh();
                  }}
                />
              }
            >
              {this.state.filteredProducts.length > 0 && (
                <View style={{ flex: 1 }}>
                  <FlatList
                    data={sortList(
                      filteredProducts,
                      'Codigo',
                      null,
                      null
                    ).slice(0, 100)}
                    keyExtractor={item => (item.Codigo || '').toString()}
                    renderItem={({ item }) => {
                      return (
                        <ListItem
                        onPress={() => {
                          console.log('item: ' + JSON.stringify(item,0,2))
                          setTimeout(()=>{
                              this.disabled = false
                          }, 3000) 
                          if (!this.disabled) {
                            this.disabled = true;
                            setProduct(JSON.parse(JSON.stringify(item)));
                            if (viewAction == viewActions.selecting) {
                              if (item.ControlaEstoque && item.EstoqueAtual <= 0) 
                              {
                                setProduct(null);
                                Alert.alert(
                                  'Produto sem estoque',
                                  'Este produto não possui estoque disponível.',
                                  [
                                    {
                                      text: 'Ok',
                                    },
                                  ],
                                  {
                                    cancelable: false,
                                  }
                                );
                                return;
                              }
                              viewActionPai == viewActions.creating ? 
                                setViewAction(viewActions.creating)
                                : viewActionPai == viewActions.editing ?
                                  setViewAction(viewActions.editing)
                                  : null;
                              goBack();
                            } else {
                                setViewAction(viewActions.viewing);
                                navigateTo('Produto');
                            }
                          }
                        }}
                        >
                          <Left>
                            <Label style={defaultStyles.listItem}>
                              {item.Nome}
                              {'\n'}
                              {`Cód. ${item.Codigo}`}
                              {item.Referencia
                                ? ` · Ref. ${item.Referencia}`
                                : ''}
                              {!this.state.naoMostrarPrecoDeCusto &&
                                `\nPreço de Custo: ${formataRealString(item.Custo)}`
                              }
                              {item.EAN && `\nEAN ${item.EAN}`}
                            </Label>
                          </Left>
                          <Right>
                            <Label
                              style={[
                                defaultStyles.textRight,
                                defaultStyles.listItemRightContainer,
                                defaultStyles.listItem,
                              ]}
                            >
                              <Label style={defaultStyles.listItemRightText}>
                                {item.PrecoFicticio > 0 && (
                                  <Label
                                    style={{
                                      textDecorationLine: 'line-through',
                                    }}
                                  >
                                    {formataRealString(item.PrecoFicticio)}
                                  </Label>
                                )}
                                {'\n'}
                                {formataRealString(item.PrecoVenda)}
                                {'\n'}
                                {item.ControlaEstoque && (
                                  <Label>
                                    {Number(item.EstoqueAtual || '')}{' '}
                                    {(item.UnidadeSigla || 'un').toLowerCase()}
                                  </Label>
                                )}
                              </Label>
                            </Label>
                          </Right>
                        </ListItem>
                      );
                    }}
                  />
                </View>
              )}
              {this.state.filteredProducts.length == 0 && (
                <View
                  style={[
                    defaultStyles.centerContentContainer,
                    marginStyles.top100,
                  ]}
                >
                  <LottieView
                    source={require('../../../assets/animations/empty.json')}
                    style={animationStyles.animation}
                    resizeMode="cover"
                    autoPlay
                  />
                  <Label
                    style={[defaultStyles.textHeader, defaultStyles.textCenter]}
                  >
                    Nenhum produto encontrado.
                  </Label>
                </View>
              )}
            </ScrollView>
          </Tab>
          <Tab
            activeTabStyle={tabStyles.tabs}
            textStyle={tabStyles.tabsText}
            tabStyle={tabStyles.tabs}
            heading={
              <TabHeading textStyle={tabStyles.tabsText} style={tabStyles.tabs}>
                <Icon name="camera" style={tabStyles.tabsText} />
              </TabHeading>
            }
          >
            {
              <RNCamera
                ref={ref => {
                  this.camera = ref;
                }}          
                type={RNCamera.Constants.Type.back}
                googleVisionBarcodeType={ RNCamera.Constants.GoogleVisionBarcodeDetection.BarcodeType.ALL}
                style={cameraStyles.container}
                androidCameraPermissionOptions={{
                  message:
                    'É necessário habilitar o uso da câmera para pesquisar produtos.',
                  title: 'Permissão para uso da câmera',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'Ok',
                }}
                onGoogleVisionBarcodesDetected={({ barcodes }) => {
                  if (barcodes.length > 0 && barcodes[0].data && this.state.cameraEnabled) {
                    this.props.handleSearch(barcodes[0].data);
                    console.log(barcodes[0]);
                    if (barcodes[0].type != 'UNKNOWN_FORMAT') {
                      Vibration.vibrate(200);
                      this.setState({
                        index: 0
                      }, console.log('barcodes:'+barcodes[0].data));
                    }
                  }
                }}
              />
            }
          </Tab>
        </Tabs>
      </View>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  activeRoute: state.routes.activeRoute,
  routes: state.routes.routes,
  showMenu: ownProps.showMenu,
  goBack: ownProps.goBack,
  query: state.routes.query,
  querySubmit: state.routes.querySubmit,
  viewAction: state.routes.viewAction,
  viewActionPai: state.routes.viewActionPai,
});

const mapDispatchToProps = dispatch => bindActionCreators(Actions, dispatch);
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProductList);
