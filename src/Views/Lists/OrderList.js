import Icon from 'react-native-vector-icons/Feather';
import React from "react";
import { View, FlatList, ScrollView, RefreshControl, Vibration } from "react-native";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as Actions from "../../Redux/actions";
import ActionButton from "react-native-action-button";
import { primaryDark } from "../../global.styles";
import viewActions from "../ViewActions";
import { ListItem, Left, Right, Label, Button, ActionSheet } from "native-base";
import defaultStyles from "../../styles";
import { formataDataString, formataRealString, sortList } from "../../utils";
import firestoreWrapper from "../../services/FirestoreWrapper";
import LottieView from 'lottie-react-native';
import animationStyles from "../../styles/Animations";
import marginStyles from "../../styles/margin";
import Colors from '../../styles/Colors';
import orderController from '../../services/Controllers/OrderController';
import toastWrapper from '../../services/ToastWrapper';
import dataStorage from '../../services/DataStorage';

class OrderList extends React.Component {
  constructor(props) {
    super(props);

    this.previousQuery = '';

    this.state = {
      orders: [],
      filteredOrders: [],
      searchQuery: "",
      isRefreshing: false,
      didUpdate: false,
    };
  }

  static propTypes = {
    activeRoute: PropTypes.shape({
      name: PropTypes.string.isRequired,
      screen: PropTypes.any.isRequired,
      icon: PropTypes.string
    }).isRequired,
    routes: PropTypes.arrayOf(PropTypes.object).isRequired,
    goBack: PropTypes.func.isRequired,
    navigateTo: PropTypes.func.isRequired
  };

  onRefresh = async () => {
    this.setState({
      isRefreshing: true,
    });

    await this.loadOrdersAsync();

    setTimeout(() => {
      this.setState({
        isRefreshing: false,
      });
    }, 500);
  };

  async componentDidMount() {
    await this.onRefresh();
  };

  async componentDidUpdate() {
    const { query, hasUpdate, setHasUpdate } = this.props;

    if (this.previousQuery != query) {
      this.handleSearchAsync(query);
    }

    this.previousQuery = query;

    if (hasUpdate) {
      await this.loadOrdersAsync();
      setHasUpdate(false);
    }
  };

  loadOrdersFromFirestoreAsync = async () => {
    let orders = await firestoreWrapper.getOrdersAsync();

    if (orders && orders.length) {
      await dataStorage.setStoredOrdersAsync(orders);
    }

    return orders;
  }

  loadOrdersAsync = async () => {
    let orders = this.state.orders || [];

    if (this.state.didUpdate && this.props.viewAction !== viewActions.selecting) {
      orders = await this.loadOrdersFromFirestoreAsync();
    }
    else {
      orders = await dataStorage.getStoredOrdersAsync();

      if (!orders || orders.length == 0) {
        orders = await this.loadOrdersFromFirestoreAsync();
      }
    }

    this.setState({
      filteredOrders: orders,
      didUpdate: true,
      orders: orders,
    });
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.onRefresh}
            />
          }
        >
          {
            this.state.filteredOrders.length > 0 &&
            <View style={{ flex: 1 }}>
              <FlatList
                data={sortList(this.state.filteredOrders, null, 'DataVenda', 'Sincronizado').slice(0, 300)}
                keyExtractor={item => item.uuid}
                renderItem={({ item }) => {
                  return (
                    <ListItem
                      delayLongPress={250}
                      onLongPress={() => {
                        if (item.Codigo) {
                          toastWrapper.showToast('Não existem ações disponíveis para esta venda.');
                          return;
                        }

                        // Vibration.vibrate(200);

                        ActionSheet.show(
                          {
                            options: ['Enviar', 'Excluir', 'Cancelar'],
                            cancelButtonIndex: 2,
                            destructiveButtonIndex: 1,
                            title: 'Manipular venda'
                          },
                          async (index) => {
                            switch (index) {
                              case 0:
                                toastWrapper.showToast('Enviando venda...');
                                await setTimeout(async () => {
                                  await orderController.sendOrderAsync(item)
                                    .then(async response => {
                                      await firestoreWrapper.postOrderAsync(item);
                                      toastWrapper.showToast('Venda enviada.');
                                      this.onRefresh();
                                    });
                                }, 1500);
                                break;

                              case 1:
                                toastWrapper.showToast('Excluindo venda...');

                                await setTimeout(async () => {
                                  await firestoreWrapper.deleteOrderAsync(item);
                                  toastWrapper.showToast('Venda excluída.');
                                  this.onRefresh();
                                }, 1500);
                                break;

                              default:
                                break;
                            }
                          }
                        )
                      }}
                      onPress={() => {
                        if (item.Sincronizado === true) {
                          this.props.setViewAction(viewActions.viewing);
                          this.props.setViewActionPai(viewActions.viewing);  
                        } else {
                          this.props.setViewAction(viewActions.editing);
                          this.props.setViewActionPai(viewActions.editing);
                        }   
                        this.props.setOrder(item);

                        this.props.navigateTo('Venda');
                      }}
                    >
                      <Left style={{
                        flexDirection: 'row',
                        flex: 1,
                      }}>
                        <Label style={defaultStyles.listItem}>
                          {`Cód. ${(item.Codigo || '').toString().padStart(4, "0")}`}
                          {' · '}
                          {formataDataString(item.DataVenda, true)}
                          {'\n'}
                          {item.EntregaNome || 'Cliente não selecionado'}
                          {' '}
                          {
                            item.EntregaUnidadeFederativa &&
                            item.EntregaLogradouroNumero &&
                            item.EntregaMunicipioNome &&
                            item.EntregaLogradouro &&
                            item.EntregaCEP &&
                            <Label>
                              {item.EntregaCEP}
                              {' · '}
                              {item.EntregaMunicipioNome}
                              {' / '}
                              {item.EntregaUnidadeFederativa}
                              {' · '}
                              {item.EntregaLogradouro}
                              {' · '}
                              {item.EntregaLogradouroNumero}
                            </Label>
                          }
                          <Label style={[defaultStyles.primaryDarkText, {
                            fontWeight: '400',
                            fontSize: 15,
                          }]}>
                            {'\n'}
                            {formataRealString(item.ValorTotal)}
                            {' · '}
                            {`${(item.Itens || []).length} ite${(item.Itens || []).length == 1 ? "m" : "ns"}`}
                          </Label>
                        </Label>
                      </Left>
                      <Right>
                        {
                          item.Sincronizado !== true &&
                          <Button
                            transparent
                            style={defaultStyles.centerContentContainer}
                            onPress={() => {
                              toastWrapper.showToast('Revise as informações para reenviar a venda para o ERP.');
                            }}
                          >
                            <Icon
                              name="alert-circle"
                              color={Colors.darkred}
                              size={30}
                            />
                          </Button>
                        }
                        {
                          item.Sincronizado === true &&
                          <Icon
                            name="check-circle"
                            color={Colors.darkgreen}
                            size={30}
                          />
                        }
                      </Right>
                    </ListItem>
                  )
                }}
              />
            </View>
          }
          {
            this.state.filteredOrders.length == 0 &&
            <View style={[defaultStyles.centerContentContainer, marginStyles.top100]}>
              <LottieView
                source={require('../../../assets/animations/empty.json')}
                style={animationStyles.animation}
                resizeMode="cover"
                autoPlay
              />
              <Label style={[defaultStyles.textHeader, defaultStyles.textCenter]}>
                Nenhuma venda encontrada.
              </Label>
            </View>
          }
        </ScrollView>

        <ActionButton
          buttonColor={primaryDark}
          onPress={() => {
            this.props.setViewAction(viewActions.creating);
            this.props.setViewActionPai(viewActions.selecting);
            this.props.setOrder(null);

            this.props.navigateTo('Venda');
          }}
        />
      </View>
    );
  }

  handleSearchAsync = async query => {
    if (!query) {
      _filteredOrders = this.state.orders;

      this.setState({
        filteredOrders: _filteredOrders,
        searchQuery: null
      });

      return;
    }

    const queryLowered = query.toLowerCase();
    let _filteredOrders = [];

    this.state.orders.forEach((value) => {
      if (
        (value.EntregaNome || '') != queryLowered &&
        (value.Codigo || '') != queryLowered
      ) {
        return;
      }
      _filteredOrders.push(value);
    });

    if (_filteredOrders.length == 0) {
      this.state.orders.forEach((value) => {
        if (!(value.EntregaNome || '').toLowerCase().includes(queryLowered)) {
          return;
        }
        _filteredOrders.push(value);
      });
    }

    this.setState({
      filteredOrders: _filteredOrders,
    });
  };
}

const mapStateToProps = (state, ownProps) => ({
  activeRoute: state.routes.activeRoute,
  routes: state.routes.routes,
  showMenu: ownProps.showMenu,
  goBack: ownProps.goBack,
  query: state.routes.query,
  viewAction: state.routes.viewAction,
  hasUpdate: state.routes.hasUpdate,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(Actions, dispatch);
;

export default connect(mapStateToProps, mapDispatchToProps)(OrderList);