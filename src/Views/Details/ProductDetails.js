import {
  Label,
  Tabs,
  ScrollableTab,
  Tab,
  Item,
  Input,
  Icon,
} from 'native-base';
import { formataRealString, formataNumberString } from '../../utils';
import { View, ScrollView, Image, Dimensions } from 'react-native';
import tabStyles from '../../styles/Tabs';
import defaultStyles from '../../styles';
import { connect } from 'react-redux';
import React from 'react';
import { bindActionCreators } from 'redux';
import * as Actions from '../../Redux/actions';
import dataStorage from '../../services/DataStorage';
import masterApi from '../../services/MasterApi';
import ActionButton from "react-native-action-button";
import { primaryDark, primaryLight } from "../../global.styles";
import LottieView from 'lottie-react-native';
import marginStyles from "../../styles/margin";
import toastWrapper from "../../services/ToastWrapper";

class ProductDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      product: this.props.selectedProduct || {},
      imagem: ''
    };
  }

  async componentDidMount() {
    await this.buscaImagemLocal();
    console.log(this.state.imagem);
    if (Object.keys(this.state.imagem).length == 0) {
      await this.buscaImagemApi(this.props.selectedProduct.Codigo)
    } 
  }

  componentWillUnmount() {
    this.props.setProduct(null);
  }

  componentDidUpdate() {

  }

  async buscaImagemLocal() {
    let imagem = await dataStorage.getStoredImagesAsync(this.props.selectedProduct.Codigo)

    this.setState({
      imagem
    });
  }

  async buscaImagemApi(codigo) {

    await masterApi.getImagemAsync(codigo)

    setTimeout(() => {
      this.buscaImagemLocal()
    }, 2000);
  }

  render() {
    return (
      <View style={defaultStyles.container}>
        <Tabs
          initialPage={0}
          renderTabBar={() => (
            <ScrollableTab
              tabsContainerStyle={tabStyles.tabs}
              style={tabStyles.tabs}
            />
          )}
        >

          <Tab
            activeTabStyle={tabStyles.tabs}
            textStyle={tabStyles.tabsText}
            tabStyle={tabStyles.tabs}
            heading="Foto"
          >

            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              {this.state.imagem.length > 5 ?
              <View>
                <Image
                  style={{width: Dimensions.get('window').width * 0.9, height: Dimensions.get('window').height * 0.9 }}
                  source={{uri: `data:image/png;base64,${this.state.imagem}`}}
                  resizeMode="contain"
                />
              </View>
              :
              <View style={[defaultStyles.centerContentContainer]}>                 
                <LottieView
                  source={require('../../../assets/animations/not-found.json')}
                  resizeMode="contain"
                  autoPlay
                />
                <Label style={[defaultStyles.textHeader, defaultStyles.textCenter,marginStyles.top200 ]}>
                  Nenhuma foto encontrada
                </Label>
              </View>
              } 
            </View>   

            <ActionButton
              buttonColor={primaryDark}
              renderIcon={() => {
                return (
                  <Icon name="md-download" style={defaultStyles.buttonIcon} />
                );
              }}
            >
              <ActionButton.Item buttonColor='#9b59b6' title="Baixar Foto" onPress={() => this.buscaImagemApi(this.state.product.Codigo)}>
                <Icon name="md-photos" style={defaultStyles.buttonIcon} />
              </ActionButton.Item>  
            </ActionButton>         

          </Tab>

          <Tab
            activeTabStyle={tabStyles.tabs}
            textStyle={tabStyles.tabsText}
            tabStyle={tabStyles.tabs}
            heading="Informações"
          >
            <ScrollView style={defaultStyles.container}>
              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Nome</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="text" />
                <Input
                  value={this.state.product.Nome}
                  editable={false}
                  multiline={true}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Código</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="key" />
                <Input
                  value={(this.state.product.Codigo || '').toString()}
                  style={defaultStyles.inputBoxText}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>EAN</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="barcode" />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.product.EAN || '-'}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Referência</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="flag" />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.product.Referencia}
                  editable={false}
                />
              </Item>

              {this.state.product.CategoriaPrincipal && (
                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>Categoria</Label>
                  <Icon style={defaultStyles.inputBoxIcon} name="flag" />
                  <Input
                    style={defaultStyles.inputBoxText}
                    value={this.state.product.CategoriaPrincipal.Nome || '-'}
                    editable={false}
                  />
                </Item>
              )}

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Preço De</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="flag" />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={formataRealString(this.state.product.PrecoFicticio)}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Preço Por</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="flag" />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={formataRealString(this.state.product.PrecoVenda)}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Estoque</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="flag" />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={`${formataNumberString(
                    this.state.product.EstoqueAtual
                  )} ${(
                    this.state.product.UnidadeSigla || 'un'
                  ).toLowerCase()}`}
                  editable={false}
                />
              </Item>
            </ScrollView>
          </Tab>
          <Tab
            activeTabStyle={tabStyles.tabs}
            textStyle={tabStyles.tabsText}
            tabStyle={tabStyles.tabs}
            heading="Medidas"
          >
            <ScrollView style={defaultStyles.container}>
              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Altura</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="flag" />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={`${formataNumberString(this.state.product.Altura)}`}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Largura</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="flag" />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={`${formataNumberString(this.state.product.Largura)}`}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Profundidade</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="flag" />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={`${formataNumberString(
                    this.state.product.Profundidade
                  )}`}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Peso</Label>
                <Icon style={defaultStyles.inputBoxIcon} name="flag" />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={`${formataNumberString(this.state.product.Peso)}`}
                  editable={false}
                />
              </Item>
            </ScrollView>
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
  selectedProduct: state.products.selectedProduct,
  viewAction: state.routes.viewAction,
});

const mapDispatchToProps = dispatch => bindActionCreators(Actions, dispatch);
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProductDetails);
