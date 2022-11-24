import React from "react";
import { View, FlatList, Vibration } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as Actions from "../../Redux/actions";
import { ScrollView, RefreshControl } from 'react-native';
import { primaryDark } from '../../global.styles';
import ActionButton from "react-native-action-button";
import viewActions from "../ViewActions";
import { Label, ListItem, Left, Right, Button, ActionSheet } from "native-base";
import firestoreWrapper from "../../services/FirestoreWrapper";
import animationStyles from "../../styles/Animations";
import LottieView from 'lottie-react-native';
import defaultStyles from "../../styles";
import Icon from 'react-native-vector-icons/Feather';
import marginStyles from "../../styles/margin";
import Colors from "../../styles/Colors";
import { sortList, genUUID } from "../../utils";
import toastWrapper from "../../services/ToastWrapper";
import customerController from "../../services/Controllers/CustomerController";
import dataStorage from "../../services/DataStorage";
import masterApi from "../../services/MasterApi";
import localStorage from "../../services/LocalStorage";

class CustomerList extends React.Component {
  constructor(props) {
    super(props);

    this.previousQuery = '';
    this.typingTimer = null;

    this.state = {
      customers: [],
      filteredCustomers: [],
      searchQuery: "",
      isRefreshing: false,
      // didUpdate: false,
    };
  }
  
  disabled = false;

  onRefresh = async () => {
    this.setState({
      isRefreshing: true,
    });
  
    await this.loadCustomersAsync();

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
      // this.handleSearchAsync(query);
      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.handleSearchAsync(this.props.query);
      }, 1000);
    }
    this.previousQuery = query;

    if (hasUpdate) {
      await this.loadCustomersAsync();
      setHasUpdate(false);
    }
  }
  async handleCustomersSync(storedCustomers) {
    toastWrapper.showToast('Sincronizando clientes...');
    let hasErrors = false;
    if (this.refreshingManually) {
      console.log('manual');

      hasErrors = await masterApi.getClientesFilaAsync(storedCustomers);
      if (!hasErrors) {
        storedCustomers.forEach(storedCustomer => {
          storedCustomer.Sincronizado = true;
          if (!storedCustomer.uuid) {
            storedCustomer.uuid = genUUID();
          }               
        });
        await firestoreWrapper.postCustomerAsync(storedCustomers);
        await dataStorage.setStoredCustomersAsync(storedCustomers);
      }    
    }
    this.refreshingManually = false;
    this.setState({
      filteredCustomers: storedCustomers,
      customers: storedCustomers,
      didUpdate: true
    });
    if (hasErrors) {
      toastWrapper.showToast('Erro na sincronização de clientes.');
    } else {
      toastWrapper.showToast('Clientes sincronizados.');
    }
  };

  loadCustomersAsync = async () => {
    let storedCustomers = (await dataStorage.getStoredCustomersAsync()) || [];
    console.log(storedCustomers);
    await this.handleCustomersSync(storedCustomers)
    // let customers = this.state.customers || [];
    
    // if (this.props.viewAction !== viewActions.selecting || this.refreshingManually) {
    //   toastWrapper.showToast('Sincronizando clientes...');

    //   if (this.refreshingManually) {
    //     customers = await firestoreWrapper.getCustomersAsync() || [];
    //     console.log(`manual:${customers}`);
    //   } else {
    //     await dataStorage.getStoredCustomersAsync().then(async storedCustomers => {
    //       if (!storedCustomers || storedCustomers.length == 0) {
    //         customers = await firestoreWrapper.getCustomersAsync() || [];
    //         console.log(`Stored:${customers}`);
    //       } else {
    //         customers = storedCustomers;
    //         console.log(`else:${customers}`);
    //       }
    //     });
    //   }

    //   this.refreshingManually = false;
    //   await masterApi.getClientesFilaAsync()
    //     .then(async customersApi => {
    //       if (customersApi.length) {
    //         await customersApi.forEach(async customerApi => {
    //           customerApi = {
    //             ...customerApi,
    //             Sincronizado: true,
    //             uuid: genUUID(),
    //           };

    //           let customerIndex = customers.findIndex(c => c.Codigo === customerApi.Codigo);
    //           if (customerIndex != -1) {
    //             customers[customerIndex] = customerApi;
    //           }
    //           else {
    //             await firestoreWrapper.postCustomerAsync(customerApi);
    //             customers.push(customerApi);
    //           }
    //         })
    //       }
    //       toastWrapper.showToast('Clientes sincronizados.');
    //     })
    //     .catch(() => {
    //       toastWrapper.showToast('Erro na sincronização de clientes.');
    //     })
    //     .finally(async () => {
    //       if (customers && customers.length) {
    //         await dataStorage.setStoredCustomersAsync(customers);
    //       }
    //     })        
    // }
    // else {
    //   await dataStorage.getStoredCustomersAsync().then(async storedCustomers => {
    //       if (!customers || storedCustomers.length == 0) {
    //         customers = await firestoreWrapper.getCustomersAsync() || [];
    //       } else {
    //         customers = storedCustomers;
    //       }
    //   })
    //   .finally(async () => {
    //     if (customers && customers.length) {
    //       await dataStorage.setStoredCustomersAsync(customers);
    //     }
    //   });     
    // }

    // this.setState({
    //   filteredCustomers: customers,
    //   customers: customers,
    //   didUpdate: true,
    // });
  }

  handleSearchAsync = async query => {
    if (!query) {
      _filteredCustomers = this.state.customers;

      this.setState({
        filteredCustomers: _filteredCustomers,
        searchQuery: null
      });

      return;
    }

    const queryLowered = query.toLowerCase();
    let _filteredCustomers = [];

    this.state.customers.forEach((value) => {
      if (
        (value.DocumentoFiscal || '').toLowerCase() != queryLowered &&
        (value.Telefone || '').toLowerCase() != queryLowered &&
        (value.Email || '').toLowerCase() != queryLowered &&
        (value.Codigo || '') != queryLowered
      ) {
        return;
      }
      _filteredCustomers.push(value);
    });
    if (_filteredCustomers.length == 0) {
      this.state.customers.forEach((value) => {
        if (
          !(value.Nome || '').toLowerCase().includes(queryLowered) &&
          !(value.Email || '').toLowerCase().includes(queryLowered)
        ) {
          return;
        }
        _filteredCustomers.push(value);
      });
    }

    // if (!_filteredCustomers.length) {
    //   await masterApi.getClienteAsync("Nome", query)
    //     .then(async customersApi => {
    //       if (customersApi.length) {
    //         await customersApi.forEach(async customerApi => {
    //           customerApi = {
    //             ...customerApi,
    //             Sincronizado: true,
    //             uuid: genUUID(),
    //           };

    //           let customerIndex = customers.findIndex(c => c.Codigo === customerApi.Codigo);

    //           if (customerIndex != -1) {
    //             customers[customerIndex] = customerApi;
    //           }
    //           else {
    //             await firestoreWrapper.postCustomerAsync(customerApi);
    //             customers.push(customerApi);
    //           }
    //           _filteredCustomers.push(customerApi);
    //         })
    //       }
    //     })
    //     .catch(() => {
    //       hasSyncError = true;
    //     })
    //   if (_filteredCustomers && _filteredCustomers.length) {
    //     await dataStorage.setStoredCustomersAsync(_filteredCustomers);
    //   }
    //   this.setState({
    //     filteredCustomers: _filteredCustomers,
    //     customers: [
    //       ...this.state.customers,
    //       _filteredCustomers
    //     ],
    //   });
    // } else {
    this.setState({
      filteredCustomers: _filteredCustomers,
    });
    // }
  };

  render() {
    const { viewActionPai, setViewAction, setCustomer, goBack, navigateTo } = this.props;
    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={() => {
                this.refreshingManually = true;
                this.onRefresh();
              }
              }
            />
          }
        >
          {
            this.state.filteredCustomers.length > 0 &&
            <View style={{ flex: 1 }}>
              <FlatList
                data={sortList(this.state.filteredCustomers, 'Nome', null, 'Sincronizado').slice(0, 200)}
                keyExtractor={item => item.uuid}
                renderItem={({ item }) => {
                  return (
                    <ListItem
                      delayLongPress={250}
                      onLongPress={() => {
                        if (item.Codigo) {
                          toastWrapper.showToast('Não existem ações disponíveis para este cliente.');
                          return;
                        }

                        // Vibration.vibrate(200);

                        ActionSheet.show(
                          {
                            options: ['Enviar', 'Excluir', 'Cancelar'],
                            cancelButtonIndex: 2,
                            destructiveButtonIndex: 1,
                            title: 'Manipular cliente'
                          },
                          async (index) => {
                            switch (index) {
                              case 0:
                                toastWrapper.showToast('Enviando cliente...');

                                await setTimeout(async () => {
                                  await customerController.sendCustomerAsync(item)
                                    .then(async response => {
                                      await firestoreWrapper.postCustomerAsync(item);
                                      toastWrapper.showToast('Cliente enviado.');
                                      this.onRefresh();
                                    });
                                }, 1500);
                                break;

                              case 1:
                                toastWrapper.showToast('Excluindo cliente...');

                                await setTimeout(async () => {
                                  await firestoreWrapper.deleteCustomerAsync(item);
                                  toastWrapper.showToast('Cliente excluído.');
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
                        setTimeout(()=>{
                          this.disabled = false
                        }, 1000); 
                        if (!this.disabled) {
                          this.disabled = true;
                          setCustomer(item);
                          if (viewActionPai == viewActions.creating) {
                            setViewAction(viewActions.creating);
                            goBack();
                          } else {
                            setViewAction(viewActions.editing);
                            navigateTo('Cliente');
                          }
                        }
                      }}
                    >
                      <Left>
                        <Label style={defaultStyles.listItem}>
                          {item.Nome}
                          {
                            (item.TelefoneDDD && item.Telefone) || item.Contato ?
                              <Label style={[defaultStyles.listItem]}>
                                {'\n'}
                                {
                                  item.TelefoneDDD &&
                                  item.Telefone &&
                                  `(${item.TelefoneDDD}) ${item.Telefone} `
                                }
                                {`${item.Contato || ''}`}
                              </Label>
                              : ''
                          }
                        </Label>
                      </Left>
                      <Right>
                        {
                          item.Sincronizado !== true &&
                          <Button
                            transparent
                            style={defaultStyles.centerContentContainer}
                            onPress={() => {
                              toastWrapper.showToast('Revise as informações para reenviar o cliente para o ERP.');
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
            this.state.filteredCustomers.length == 0 &&
            <View style={[defaultStyles.centerContentContainer, marginStyles.top100]}>
              <LottieView
                source={require('../../../assets/animations/empty.json')}
                style={animationStyles.animation}
                resizeMode="cover"
                autoPlay
              />
              <Label style={[defaultStyles.textHeader, defaultStyles.textCenter]}>
                Nenhum cliente encontrado.
              </Label>
            </View>
          }
        </ScrollView>

        <ActionButton
          buttonColor={primaryDark}
          onPress={() => {
            setViewAction(viewActions.creating);
            setCustomer(null);
            navigateTo('Cliente');
          }}
        />
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
  viewAction: state.routes.viewAction,
  viewActionPai: state.routes.viewActionPai,
  hasUpdate: state.routes.hasUpdate,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(Actions, dispatch);
;

export default connect(mapStateToProps, mapDispatchToProps)(CustomerList);
