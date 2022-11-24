import React from "react";
import { Tab, Button, Tabs, Segment, ScrollableTab, Icon, ListItem, Left, Label, Right, Item, Input, Picker, Content, Footer, Switch, ActionSheet, Col } from 'native-base';
import { Modal, View, Text, FlatList, Alert, StyleSheet, TouchableOpacity, Platform, BackHandler, Image } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as Actions from "../../Redux/actions";
import localStorage from '../../services/LocalStorage';

import { ScrollView } from 'react-native-gesture-handler';
import firestoreWrapper from "../../services/FirestoreWrapper";
import ActionButton from "react-native-action-button";
import { formataRealString, formataRealStringSemRS, formataNumberString, formataRealFloat, formataDataString, formataRealAbsString, genUUID, breakLineText,acaoPermitida } from '../../utils';
import masterApi from "../../services/MasterApi";
import LottieView from 'lottie-react-native';
import viewActions from '../ViewActions';
import Slider from '@react-native-community/slider';
import { TextInputMask } from 'react-native-masked-text';
import update from 'immutability-helper';
import moment from 'moment';
import { primaryDark, primaryLight } from '../../global.styles';
import tabStyles from '../../styles/Tabs';
import footerStyles from "../../styles/Footer";
import modalStyles from "../../styles/Modal";
import defaultStyles from '../../styles';
import segmentStyles from '../../styles/Segment'
import animationStyles from "../../styles/Animations";
import Colors from "../../styles/Colors";
import orderController from "../../services/Controllers/OrderController";
import toastWrapper from "../../services/ToastWrapper";
import marginStyles from "../../styles/margin";
import dataStorage from "../../services/DataStorage";

class OrderDetails extends React.Component {
  constructor(props) {
    super(props);

    const dataAtual = moment().format('YYYY-MM-DDTHH:mm:ss.sssZ');

    let order = this.props.selectedOrder || {
      uuid: genUUID(),
      TipoVenda: 'V',
      HoraVenda: dataAtual,
      DataVenda: dataAtual,
      VendaPagamentos: this.createVendaPagamentos(),
      Parcelas: [],
      Itens: [],
      parcelMethod: {},
      CodigoFormaPagamento: 0,
      FormaParcelamentoCodigo: 0,
      FormaParcelamentoNome: '',
      ValorTotal: 0,
      ValorTotalBruto: 0,
      Orcamento: false,
      Cancelada: false,
      Reservada: false,
      ClienteCodigo: 1,
      ClienteNome: "CONSUMIDOR",
      EntregaNome: "CONSUMIDOR",
      QuantidadeTotal: 0,
      customer: { Codigo: 1, Nome: "CONSUMIDOR" },
      shippingAdrressSameAsCustomer: true,
      TransportadoraCodigo: 0,
      TransportadoraNome: 'SEM TRANSPORTADORA',
      Entrega: false,
      TipoDescontoValor: false,
      ValorDesconto: 0,
      ValorDescontoValor: 0,
      Troco: 0,
      ValorPago: 0,
      TipoDescontoItem: true,
      DescontoTotalMax: 0,
      DescontoTotalMaxValor: 0,
      PermiteDescontoAcimaCadastrado: false,
      NaoMostrarPrecoDeCusto: false,
      CodigoStatus: 0,
      VendaMobile: true,
      Origem: 'V',
      Observacoes: ''
    };

   
    if (order.shippingAdrressSameAsCustomer == null) {
      order.shippingAdrressSameAsCustomer = true;
    }

    this.state = {
      modalItemQuantidadeMax: 999,//10,
      itemModalVisible: false,
      discountModalVisible: false,
      modalItem: {
        Imagem: String
      },
      creating: this.props.selectedOrder == null,
      addCustomerButonIcon: 'md-add',
      animationChangePage: false,
      showingAnimation: false,
      parcelMethods: [],
      order: order,
      paymentMethods: [],
      paymentMethodsAPrazo: [],
      paymentMethodsAVista: [],
      carriers: [],
      discount: '0',
      inputDiscount: '0',
      voltando: false,
      storedSettings: [],
      currentSegment: 'V',
    }
  }

  callAnimation(name, updatePage = true) {
    this.setState({
      showingAnimation: true,
      animationName: name,
    });

    this.props.setRunningAnimation(true);

    setTimeout(() => {
      this.setState({
        animationChangePage: updatePage === true,
      });
    }, 2500);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
  }

  handleBackButton = () => {
    if 
    (
      (this.props.activeRoute.name == 'Venda' || this.props.activeRoute.screen.displayName == 'Connect(OrderDetails)') && 
      (!this.state.voltando) && ((this.props.viewAction == viewActions.creating) || (this.props.viewAction == viewActions.editing))
    ) {
      Alert.alert(
        'ATENÇÃO!',
        'Se tentar voltar novamente para a tela inicial, você perderá os detalhes da venda!',
        [
          {
            text: 'OK', 
            onPress: () => {   
              this.setState({
                voltando: true,
              });
            },
          }
        ],
        {cancelable: false},
      );
      return true;
    }
    this.setState({
      voltando: false,
    });
    return false;
  }   
  
  onRefresh = async () => {
    if (this.state.currentSegment=='P') {
      this.parcelMethodChanged(1);
    }

    setTimeout(() => {
      this.setState({
        order: {
          ...this.state.order,
          VendaPagamentos: this.createVendaPagamentos(),
          TipoVenda: this.state.currentSegment,
          ValorPago: (this.state.currentSegment == 'V'? 0 : this.state.order.ValorTotal),
          Parcelas: (this.state.currentSegment == 'V'? []: this.state.order.Parcelas),
          FormaParcelamentoCodigo: (this.state.currentSegment == 'V'? 0 : this.state.order.FormaParcelamentoCodigo),
          FormaParcelamentoNome: (this.state.currentSegment == 'V'? '' : this.state.order.FormaParcelamentoNome),
        }
      });
    }, 200);
  }

  updateCart = () => {
    const { order } = this.state
    let orderItens = order.Itens;
    
    let ValorTotalBruto = orderItens.reduce((valorTotal, i) => { return valorTotal + (i.Quantidade * i.ItemValorBruto) }, 0)
    let valorTotalLiquido = orderItens.reduce((valorTotal, i) => { return valorTotal + (i.Quantidade * i.ItemValorLiquido) }, 0); 
    let quantidadeTotal = orderItens.reduce((quantidadeTotal, i) => { return quantidadeTotal + i.Quantidade }, 0);
    let descontoTotalMaxValor = orderItens.reduce((valorTotal, i) => { return valorTotal + (i.Quantidade * i.ItemValorBruto) * i.DescontoMaximo/100 }, 0);

    this.setState({
      order: {
        ...order,
        Itens: [
          ...order.Itens
        ],
        ValorTotalBruto: ValorTotalBruto,
        ValorTotal: valorTotalLiquido,
        QuantidadeTotal: quantidadeTotal,
        ValorDesconto: (1-(valorTotalLiquido/ValorTotalBruto))*100,
        ValorDescontoValor: ValorTotalBruto - valorTotalLiquido,
        DescontoTotalMaxValor: descontoTotalMaxValor,
        DescontoTotalMax: descontoTotalMaxValor/ValorTotalBruto
      }
    });
  }

  async componentDidUpdate() {
    if (this.state.itemModalVisible) {
      return;
    }

    const { selectedCustomer, selectedProduct } = this.props;
    const { order, animationChangePage, modalItem } = this.state;

    if (animationChangePage) {
      this.props.setRunningAnimation(false);
      this.props.popActiveRoute();
    }

    if (this.itemUpdated) {
      this.itemUpdated = false;
      const index = order.Itens.findIndex(i => i.ProdutoCodigo == modalItem.ProdutoCodigo);
      let orderItems = order.Itens;
      orderItems[index].Quantidade = modalItem.Quantidade;
      
      // console.log('ENTRADA DO MODAL: ItemDescontoValor: ' + modalItem.ItemDescontoValor);
      // console.log('ENTRADA DO MODAL: ItemDescontoPercentual: ' + modalItem.ItemDescontoPercentual);

      if (order.TipoDescontoItem == true) {
        orderItems[index].ItemDescontoValor = ((modalItem.ItemDescontoValor.replace(",","."))*1).toFixed(5);
        orderItems[index].ItemDescontoPercentual = ((modalItem.ItemDescontoValor.replace(",",".")/orderItems[index].ItemValorBruto)*100).toFixed(5);
      } else {
        orderItems[index].ItemDescontoValor = ((modalItem.ItemDescontoPercentual.replace(",",".")/100) * orderItems[index].ItemValorBruto).toFixed(5);
        orderItems[index].ItemDescontoPercentual = (modalItem.ItemDescontoPercentual.replace(",",".")*1).toFixed(5);
      }

      orderItems[index].ItemValorLiquido = orderItems[index].ItemValorBruto - orderItems[index].ItemDescontoValor;

      // console.log('SAÍDA DO MODAL: ItemDescontoValor: ' + modalItem.ItemDescontoValor);
      // console.log('SAÍDA DO MODAL: ItemDescontoPercentual: ' + modalItem.ItemDescontoPercentual);

      this.setState({
        order: {
          ...order,
          Itens: [
            ...order.Itens
          ], 
        },
      });

      this.updateCart();
    }

    if (this.selectingProduct && selectedProduct) {
      if (selectedProduct.EstoqueAtual > 0) {
      this.selectingProduct = false;
      const index = order.Itens.findIndex(i => i.ProdutoCodigo == selectedProduct.Codigo);
      selectedProduct.Quantidade = 1;
      let orderItems = order.Itens;
      selectedProduct.ProdutoCodigo = selectedProduct.Codigo;

      if (index !== -1) {
        orderItems[index].Quantidade++;
      }
      else {
        selectedProduct.Quantidade = 1;
        selectedProduct.Codigo = undefined;
        selectedProduct.ItemNome = selectedProduct.Nome;
        selectedProduct.PrecoUnitarioVenda = selectedProduct.PrecoVenda;
        selectedProduct.ItemValorBruto = selectedProduct.PrecoUnitarioVenda;
        selectedProduct.ItemDescontoPercentual = '0';
        selectedProduct.ItemDescontoValor = '0';
        selectedProduct.ItemValorLiquido = selectedProduct.ItemValorBruto - selectedProduct.ItemDescontoValor*1;
        
        selectedProduct.Imagem = await dataStorage.getStoredImagesAsync(selectedProduct.ProdutoCodigo)
        orderItems.push(selectedProduct);
      }
      
      this.setState({
        order: {
          ...order,
          Itens: [
            ...order.Itens
          ]  
        }
      });

      setTimeout(() => {
        this.updateCart();
      }, 500);

      this.props.setProduct(null);
      }
    }

    if (this.selectingCustomer && selectedCustomer) {
      this.selectingCustomer = false;
      this.setState({
        order: update(
          order, {
            customer: {
              $set: selectedCustomer,
            },
            ClienteCodigo: {
              $set: selectedCustomer.Codigo,
            },
            ClienteNome: {
              $set: selectedCustomer.Nome,
            },
            EntregaNome: {
              $set: !order.shippingAdrressSameAsCustomer ? order.EntregaNome : selectedCustomer.Nome,
            },
            EntregaTelefone: {
              $set: !order.shippingAdrressSameAsCustomer ? order.EntregaTelefone : `${formataNumberString(selectedCustomer.TelefoneDDD + selectedCustomer.Telefone)}`,
            },
            EntregaEmail: {
              $set: !order.shippingAdrressSameAsCustomer ? order.EntregaEmail : selectedCustomer.Email,
            },
            ClienteDocumento: {
              $set: !order.shippingAdrressSameAsCustomer ? order.ClienteDocumento : selectedCustomer.DocumentoFiscal,
            },
            ClienteIdentidade: {
              $set: !order.shippingAdrressSameAsCustomer ? order.ClienteIdentidade : selectedCustomer.Identidade,
            },
            EntregaCEP: {
              $set: !order.shippingAdrressSameAsCustomer ? order.EntregaCEP : selectedCustomer.CEP,
            },
            EntregaMunicipioNome: {
              $set: !order.shippingAdrressSameAsCustomer ? order.EntregaMunicipioNome : selectedCustomer.MunicipioNome,
            },
            EntregaUnidadeFederativa: {
              $set: !order.shippingAdrressSameAsCustomer ? order.EntregaUnidadeFederativa : selectedCustomer.UnidadeFederativa,
            },
            EntregaLogradouro: {
              $set: !order.shippingAdrressSameAsCustomer ? order.EntregaLogradouro : selectedCustomer.Logradouro,
            },
            EntregaLogradouroNumero: {
              $set: !order.shippingAdrressSameAsCustomer ? order.EntregaLogradouroNumero : selectedCustomer.LogradouroNumero,
            },
            EntregaBairro: {
              $set: !order.shippingAdrressSameAsCustomer ? order.EntregaBairro : selectedCustomer.Bairro,
            },
            EntregaLogradouroComplemento: {
              $set: !order.shippingAdrressSameAsCustomer ? order.EntregaLogradouroComplemento : selectedCustomer.LogradouroComplemento,
            },
          }),
      })

      this.props.setCustomer(null);

      this.setState({
        addCustomerButonIcon: 'md-create',
      });
    }
  }

  aplicaDescontoGlobal(descontoGlobal) {
    const { order } = this.state

    if (order.TipoDescontoValor == false) {
      descontoGlobal = descontoGlobal/100 * order.ValorTotalBruto;
    }

    if (this.verificaDesconto(true, descontoGlobal)) {
      descontoGlobal = 0;
    }

    let percentualDescontoMaxItemVenda = 0;
    let descontoUnitario = 0;
    let orderItens = order.Itens;
    let descontoMaxItem = 0;
    orderItens.map((i => { 
      descontoMaxItem = (i.DescontoMaximo/100*i.ItemValorBruto);
      percentualDescontoMaxItemVenda = descontoMaxItem / order.DescontoTotalMaxValor;
      descontoUnitario = (descontoGlobal * percentualDescontoMaxItemVenda).toFixed(2);
      i.ItemValorLiquido = i.ItemValorBruto - descontoUnitario;
      i.ItemDescontoValor = descontoUnitario;
      i.ItemDescontoPercentual = ((descontoUnitario/i.ItemValorBruto)*100).toFixed(5);

    }))
    
  }

  verificaDesconto(descontoVenda, valorDesconto) {
    const { DescontoMaximo, ItemValorBruto } = this.state.modalItem;
    const { order } = this.state;
    let descontoPermitidoValor = DescontoMaximo/100 * ItemValorBruto;
    let descontoPermitido = DescontoMaximo/100;
    if (descontoVenda) {
      if ((valorDesconto > order.DescontoTotalMaxValor) && (!this.state.order.PermiteDescontoAcimaCadastrado)) {
        Alert.alert(
          'Desconto acima do permitido',
          'O desconto máximo permitido é de R$'+ order.DescontoTotalMaxValor.toFixed(2) +' ou ' + (order.DescontoTotalMax*100).toFixed(2)+'%.',
          [
            {
              text: 'Ok',
            },
          ],
          {
            cancelable: false
          },
        );
        this.setState({ 
          discount: 0
          
        });
        
        return true;
      }
      return false;
    } 
    else {
      if ((valorDesconto > descontoPermitidoValor) && (!this.state.order.PermiteDescontoAcimaCadastrado)) {
        Alert.alert(
          'Desconto acima do permitido',
          'O desconto máximo permitido é de R$'+ descontoPermitidoValor.toFixed(2) +' ou ' + descontoPermitido.toFixed(2)+'%.',
          [
            {
              text: 'Ok',
            },
          ],
          {
            cancelable: false
          },
        );
        this.setState({ 
          discount: 0,
          modalItem: {
            ...this.state.modalItem,
            ItemDescontoPercentual: '0', 
            ItemDescontoValor: '0'
          }
        });
        
        return true;
      }
      return false;
    }
  }

  loadSettingsAsync = async () => {
    const permiteDescontoAcimaCadastrado = await acaoPermitida('VD_DESCONTO_MAIOR');   
    this.setState({
      order: {
        ...this.state.order, 
        PermiteDescontoAcimaCadastrado: permiteDescontoAcimaCadastrado,
      }
    });     
  }

  async componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);

    localStorage.setValueAsync('data.editando_venda');
    this.loadParcelMethods();
    this.loadPaymentMethods();
    this.loadCarriers();
    this.updateCart();  
    this.loadSettingsAsync();
    await this.addItem();
  }

  loadCarriers = async () => {
    let carriers = [
      {
        Codigo: 0,
        Nome: 'SEM TRANSPORTADORA'
      }
    ];
    const storedCarriers = await localStorage.getValueAsync('data.carriers') || [];
    storedCarriers.forEach((item) => carriers.push(item));
    this.setState({
      carriers: carriers,
    })
  }

  loadPaymentMethods = async () => {
    const paymentMethods = await localStorage.getValueAsync('data.paymentMethods') || [];
    let paymentMethodsAVista = [], paymentMethodsAPrazo = [];
    paymentMethods.forEach((item) => {
      switch (item.Uso.trim()) {
        case '':
          paymentMethodsAPrazo.push(item);
          paymentMethodsAVista.push(item);
          break;

        case 'A':
          paymentMethodsAPrazo.push(item);
          paymentMethodsAVista.push(item);
          break;

        case 'V':
          paymentMethodsAVista.push(item);
          break;

        case 'P':
          paymentMethodsAPrazo.push(item);
          break;

        default:
          break;
      }
    })
    await this.setState({
      paymentMethods: paymentMethods,
      paymentMethodsAPrazo: paymentMethodsAPrazo,
      paymentMethodsAVista: paymentMethodsAVista,
    });
  }

  loadParcelMethods = async () => {
    await this.setState({
      parcelMethods: await localStorage.getValueAsync('data.parcelMethods') || [],
    });
    if (this.state.order.FormaParcelamentoCodigo == 0) {
      const parcelMethod = await localStorage.getValueAsync('data.parcelMethod.aVista');
      await this.setState({
        order: {
          ...this.state.order,
          parcelMethod: parcelMethod,
          FormaParcelamentoCodigo: parcelMethod.Codigo,
          FormaParcelamentoNome: parcelMethod.Nome
        }
      }
      );
    }
  }

  addItem = async () => {
    const { viewAction, viewActionPai, setViewAction, setViewActionPai, navigateTo } = this.props;
    this.selectingProduct = true;

    if (viewAction == viewActions.creating) {
      setViewActionPai(viewActions.creating);
    }
    if (viewAction == viewActions.editing) {
      setViewActionPai(viewActions.editing);
    }
  
    setViewAction(viewActions.selecting);
    if (viewActionPai == viewActions.creating) {
      this.props.navigateTo("Produtos");
    }   
  }

  removeItem = async () => {
    const { modalItem, order } = this.state;
    const index = order.Itens.findIndex(i => i.ProdutoCodigo == modalItem.ProdutoCodigo);

    order.Itens.splice(index, 1);

    this.updateCart();
  }

  addCustomer = async () => {
    this.selectingCustomer = true;
    this.props.setViewActionPai(viewActions.creating);
    this.props.setViewAction(viewActions.selecting);
    this.props.navigateTo("Clientes");
  }

  parcelMethodChanged = async (formaParcelamentoCodigo) => {
    if (this.state.order.formaParcelamentoCodigo == formaParcelamentoCodigo) {
      return;
    }
    this.state.parcelMethods.forEach(
      (value) => {
        if (value.Codigo == formaParcelamentoCodigo) {
          let parcelas = [];
          const valorTotal = Number(this.state.order.ValorTotal);
          const dataGerada = moment().format('YYYY-MM-DDTHH:mm:ss.sssZ');
          let ultimaData = moment(this.state.order.DataVenda).add(value.DiasInicial, 'days');
          for (let index = 0; index < value.Quantidade; index++) {
            parcelas.push(
              {
                CodigoCliente: this.state.order.ClienteCodigo,
                CodigoParcelamento: value.Codigo,
                CodigoFormaPagamento: this.state.paymentMethodsAPrazo[0].Codigo,
                DataGerada: dataGerada,
                HoraGerada: dataGerada,
                Numero: `${Number(index + 1).toString().padStart(2, '0')}/${Number(value.Quantidade).toString().padStart(2, '0')}`,
                Valor: valorTotal / value.Quantidade,
                DataVencimento: ultimaData.format('YYYY-MM-DDTHH:mm:ss.sssZ'),
              }
            );
            ultimaData = ultimaData.add(value.Intervalo, 'days');
          }
          this.arrumaCentavos(parcelas, valorTotal);
          this.setState({
            order: {
              ...this.state.order,
              parcelMethod: value,
              CodigoFormaPagamento: 1,
              FormaParcelamentoCodigo: formaParcelamentoCodigo,
              FormaParcelamentoNome: value.Nome,
              Parcelas: parcelas,
              ValorPago: valorTotal,
              VendaPagamentos: [],
            },
          });
          return;
        }
      }
    )
  }
  
  arrumaCentavos = (parcelas, valorTotal) => {

    let valorComDiferenca = Math.round(parcelas[0].Valor * 100, -2) / 100;
    let diferenca = Math.round((valorComDiferenca*parcelas.length - valorTotal) * 100, -2) / 100;
    parcelas[0].Valor -= diferenca;
  }

  modalItemQuantidadeMax = (Quantidade) => {
    if (Quantidade < 10) {
      return 10;
    } else if (Quantidade < 30) {
      return 30;
    } else if (Quantidade < 50) {
      return 50;
    } else if (Quantidade < 100) {
      return 100;
    } else if (Quantidade < 300) {
      return 300;
    } else if (Quantidade < 500) {
      return 500;
    } else if (Quantidade < 1000) {
      return 1000;
    } else {
      return 9999;
    }
  }

  render() {
    let parcelMethodsPickerItems = this.state.parcelMethods.map((parcelMethod) => {
      return <Picker.Item key={parcelMethod.Codigo} value={parcelMethod.Codigo} label={parcelMethod.Nome} />
    });
    let carriersPickerItems = this.state.carriers.map((carrier) => {
      return <Picker.Item key={carrier.Codigo} value={carrier.Codigo} label={carrier.Nome} />
    });
    if (!this.state.showingAnimation) {
      return (
        <Tabs
          initialPage={0}
          renderTabBar={() =>
            <ScrollableTab
              tabsContainerStyle={tabStyles.tabs}
              style={tabStyles.tabs}
            />
          }
        >
          <Tab
            activeTabStyle={tabStyles.tabs}
            textStyle={tabStyles.tabsText}
            tabStyle={tabStyles.tabs}
            heading="Carrinho"
          >
            <View style={defaultStyles.container}>
              <View>
                <Modal
                  animationType="slide"
                  visible={this.state.itemModalVisible}
                  transparent={true}
                  backdrop={true}
                  onRequestClose={() => {
                    this.setState({ itemModalVisible: false });
                  }}
                >
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPressOut={() => {
                      this.setState({ itemModalVisible: false })
                    }}
                  >
                  </TouchableOpacity>
                  
                  <View style={modalStyles.modalBig}>
                    
                    
                    {
                      (this.state.modalItem.Imagem != undefined) && (this.state.modalItem.Imagem.length > 5) ?
                        <Image
                          style={{width: 150, height: 150 }}
                          source={{uri: `data:image/png;base64,${this.state.modalItem.Imagem}`}}
                          resizeMode="contain"
                        />
                      :
                      <View style={[defaultStyles.centerContentContainer]}>                 
                        <LottieView
                          source={require('../../../assets/animations/not-found.json')}
                          // style={animationStyles.animation}
                          resizeMode="contain"
                          autoPlay
                        />
                        <Label style={[defaultStyles.textHeader, defaultStyles.textCenter,marginStyles.top100 ]}>
                          Nenhuma foto encontrada
                        </Label>
                      </View> 
                    }
                  {this.state.modalItem.Imagem == null &&
                    <Text>{'\n'}</Text>
                  }                  

                    <Item>
                      <Label>Preço</Label>
                      <Input
                        style={[defaultStyles.inputBoxText, defaultStyles.textCenter]}
                        value={formataRealString(this.state.modalItem.PrecoVenda)}
                        editable={false}
                      />
                    </Item>
                    <Item>
                      <Label>Tipo do desconto</Label>
                      <Picker
                        selectedValue={this.state.order.TipoDescontoItem}
                        onValueChange={(itemValue) => {
                          this.setState({
                            order: {
                              ...this.state.order,
                              TipoDescontoItem: itemValue
                            }
                          })
                        }}
                      >
                        <Picker.Item label='R$' value={true} />
                        <Picker.Item label='%' value={false} />
                      </Picker>
                      
                    </Item>
                    <Item>
                      <Label>Desconto</Label>
                        <Input
                          style={[defaultStyles.inputBoxText, defaultStyles.textCenter]}
                          keyboardType='decimal-pad'
                          value={
                            this.state.order.TipoDescontoItem == true ?   
                              `${this.state.modalItem.ItemDescontoValor}`
                              : `${this.state.modalItem.ItemDescontoPercentual}`
                          }
                          editable={true}
                          onChangeText={valor => {
                            this.state.order.TipoDescontoItem == false ? 
                              this.setState({
                                modalItem: {
                                  ...this.state.modalItem,
                                  ItemDescontoPercentual: valor, 
                                }
                              }) :
                              this.setState({
                                modalItem: {
                                  ...this.state.modalItem,
                                  ItemDescontoValor: valor
                                }
                              }) 

                          }}
                        />
                    </Item>
                    <Item>
                      <Label>Quantidade</Label>
                      <Input
                        style={[defaultStyles.inputBoxText, defaultStyles.textCenter]}
                        value={String(this.state.modalItem.Quantidade)}
                        onChangeText={(text) => {
                          if (formataNumberString(text) > this.state.modalItem.EstoqueAtual) {
                            text = this.state.modalItem.EstoqueAtual;   
                          }
                          this.setState({
                            modalItem: {
                              ...this.state.modalItem,
                              Quantidade: formataNumberString(text),
                            }
                          })
                        }
                        }
                        keyboardType='numeric'
                      />
                    </Item>
                    <Content style={{ width: 300, marginTop: 25 }}>
                      <Slider
                        minimumValue={0}
                        maximumValue={
                          this.state.modalItem.ControlaEstoque
                            ? formataNumberString(this.state.modalItem.EstoqueAtual)
                            : this.modalItemQuantidadeMax(this.state.modalItem.Quantidade)
                        }
                        value={this.state.modalItem.Quantidade}
                        onValueChange={(value) => this.setState({
                          modalItem: {
                            ...this.state.modalItem,
                            Quantidade: value,
                            Parcelas: [],
                            VendaPagamentos: [],
                          }
                        })}
                        step={1}
                      />
                    </Content>

                    <Button block danger
                      onPress={() => {
                        this.removeItem();
                        this.setState({ itemModalVisible: false })
                      }}
                    >
                      <Text style={{ color: Colors.white }}>Remover do Carrinho</Text>
                    </Button>

                    <Button block style={{ backgroundColor: primaryDark, marginTop: 15 }}
                      onPress={() => {
                        if (this.state.modalItem.Quantidade <= 0) {
                          this.removeItem();
                        } else {
                          this.itemUpdated = true;
                        }

                        if ((this.state.modalItem.ItemDescontoValor > 0) || (this.state.modalItem.ItemDescontoPercentual > 0)) {
                          this.state.order.TipoDescontoItem == false ? 
                          this.verificaDesconto(false, this.state.modalItem.ItemDescontoPercentual/100 * this.state.modalItem.PrecoVenda):
                          this.verificaDesconto(false, this.state.modalItem.ItemDescontoValor);
                        }

                        this.setState({ itemModalVisible: false })
                      }}
                    >
                      <Text style={{ color: Colors.white }}>Aplicar</Text>
                    </Button>
                  </View>
                </Modal>
              </View>

              <FlatList
                keyExtractor={(item) => { return item.ProdutoCodigo.toString() }}
                data={this.state.order.Itens}
                renderItem={({ item }) => {
                  return (
                    <ListItem onPress={() => {
                      this.setState({
                        itemModalVisible: true,
                        modalItem: item,
                      })
                    }}>
                      <Left>
                        <Label style={defaultStyles.listItem}>
                          {item.Nome}
                          {'\n'}
                          {`Cód. ${item.ProdutoCodigo}`}
                          {item.Referencia ? ` - ${item.Referencia}` : ''}
                          {
                            <Label style={defaultStyles.primaryLightText}>
                              {'\n'}
                              {`${item.Quantidade} unidade${item.Quantidade == 1 ? '' : 's'} no carrinho`}
                            </Label>
                          }
                        </Label>
                      </Left>
                      <Right>
                        <Label style={[defaultStyles.textRight, defaultStyles.listItemRightText]}>
                          <Label style={[defaultStyles.listItemRightText, {
                            fontSize: this.state.discount > 0 ? 13 : 15,
                          }]}>
                            Vl. Unit.:
                            {'\n'}
                            {formataRealString(item.ItemValorBruto)}
                            {
                              (this.state.discount > 0 || item.ItemDescontoValor > 0) &&
                              <Label style={[defaultStyles.listItemRightText, {
                                fontSize: this.state.discount > 0 ? 13 : 15,
                                color: Colors.darkorange,
                              }]}>
                                {'\n'}
                                {`-${formataRealString(item.PrecoVenda - item.ItemValorLiquido)}`}
                                {'\n'}
                                {'\n'}
                                <Label style={[defaultStyles.listItemRightText]}>
                                  {formataRealString(item.ItemValorLiquido)}
                                </Label>
                              </Label>
                            }
                          </Label>
                        </Label>
                      </Right>
                    </ListItem>
                  )
                }
                }
              />

              <View>
                <Modal
                  animationType="slide"
                  visible={this.state.discountModalVisible}
                  transparent={true}
                  backdrop={true}
                  onRequestClose={() => {
                    this.setState({ discountModalVisible: false })
                  }}
                >
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPressOut={() => {
                      this.setState({ discountModalVisible: false })
                    }}
                  >
                  </TouchableOpacity>
                  <View style={modalStyles.modal}>
                    <Item picker style={defaultStyles.inputBox}>
                      <Label>
                        Tipo
                      </Label>
                      <Picker
                        selectedValue={this.state.order.TipoDescontoValor}
                        onValueChange={(itemValue) => this.setState({
                          order: {
                            ...this.state.order,
                            TipoDescontoValor: itemValue
                          }
                        })}
                      >
                        <Picker.Item label='R$' value={true} />
                        <Picker.Item label='%' value={false} />
                      </Picker>
                    </Item>

                    <Item >
                      <Label>Desconto: </Label>
                      <Input
                        autoFocus={true}
                        keyboardType='decimal-pad'
                        style={defaultStyles.inputBoxText}
                        defaultValue={this.state.discount}
                        onChangeText={(text) => {
                          this.setState({ inputDiscount: text })
                        }}
                      />

                    </Item>
                    <Button block style={{ marginTop: 20, backgroundColor: primaryDark }}
                      onPress={() => {
                        this.setState({ discount: this.state.inputDiscount, discountModalVisible: false })
                        setTimeout(() => {
                          this.aplicaDescontoGlobal(this.state.inputDiscount);
                          this.updateCart();
                        }, 500);
                      }}
                    >
                      <Text style={{ color: Colors.white }}>Aplicar Desconto</Text>
                    </Button>
                  </View>
                </Modal>
              </View>

              <Footer style={footerStyles.footer}>
                <View style={footerStyles.orderFooter}>
                  <Label style={[footerStyles.footerText, defaultStyles.textCenter, { color: 'white' }]}>
                    {/* {`Desc Max: R$ ${this.state.order.DescontoTotalMaxValor} | ${this.state.order.DescontoTotalMax*100}%`} */}
                    {`${this.state.order.QuantidadeTotal} ite${this.state.order.QuantidadeTotal == 1 ? 'm' : 'ns'} no carrinho`}
                    {'\n'}
                    {formataRealString(this.state.order.ValorTotal)}
                  </Label>
                  {!this.state.discountModalVisible &&
                    <Right>
                      <Button
                        transparent
                        onPress={() => {
                          this.setState({ discountModalVisible: true })
                        }}
                      >
                        <Label style={[footerStyles.footerText, defaultStyles.textCenter, { color: 'white' }]}>
                          <Text>Descontos</Text>
                        </Label>
                      </Button>

                    </Right>}
                </View>
              </Footer>
              <ActionButton
                buttonColor={primaryDark}
                onPress={this.addItem}
                title="Add"
                style={{ 'marginBottom': 40 }}
                renderIcon={() => {
                  return (
                    <Icon
                      style={defaultStyles.buttonIcon}
                      name="md-add"
                    />
                  );
                }}
              />

            </View>
          </Tab>
          <Tab
            activeTabStyle={tabStyles.tabs}
            textStyle={tabStyles.tabsText}
            tabStyle={tabStyles.tabs}
            heading="Cliente"
          >
            <ScrollView style={defaultStyles.container}>
              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Nome</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="person"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaNome}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Telefone</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="paper-plane"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaTelefone}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Email</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="mail"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaEmail}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>CPF/ CNPJ</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="person"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.ClienteDocumento}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>RG/ IE</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="person"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.ClienteIdentidade}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>CEP</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaCEP}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Cidade</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaMunicipioNome}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Estado</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaUnidadeFederativa}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Logradouro</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaLogradouro}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Número</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaLogradouroNumero}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Bairro</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaBairro}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Complemento</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaLogradouroComplemento}
                  editable={false}
                />
              </Item>
            </ScrollView>
            <ActionButton
              buttonColor={primaryDark}
              onPress={this.addCustomer}
              title="Add"
              renderIcon={() => {
                return (
                  <Icon
                    name={this.state.addCustomerButonIcon}
                    style={defaultStyles.buttonIcon}
                  />
                );
              }}
            />
          </Tab>
          <Tab
            activeTabStyle={tabStyles.tabs}
            textStyle={tabStyles.tabsText}
            tabStyle={tabStyles.tabs}
            heading="Envio"
          >
            <ScrollView style={defaultStyles.container}>

              <Item picker style={defaultStyles.inputBox}>
                <Label>Envio</Label>
                <Picker
                  selectedValue={this.state.order.TransportadoraCodigo}
                  onValueChange={(itemValue) => {
                    const carrier = this.state.carriers.find(i => i.Codigo == itemValue);
                    this.setState({
                      order: {
                        ...this.state.order,
                        TransportadoraCodigo: carrier.Codigo,
                        TransportadoraNome: carrier.Nome,
                        Entrega: carrier.Codigo == 0,
                      }
                    })
                  }}
                >
                  {carriersPickerItems}
                </Picker>
              </Item>

              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
              }}>
                <Item style={defaultStyles.inputBox} style={{
                  borderColor: 'transparent',
                  marginTop: 15,
                }}>
                  <Label>Usar endereço do cliente?</Label>
                  <Switch
                    value={this.state.order.shippingAdrressSameAsCustomer}
                    onValueChange={(value) => {
                      this.setState({
                        order: {
                          ...this.state.order,
                          shippingAdrressSameAsCustomer: value,
                          EntregaNome: !value ? this.state.order.EntregaNome : this.state.order.customer.Nome,
                          EntregaTelefone: !value ? this.state.order.EntregaTelefone : `${formataNumberString(this.state.order.customer.TelefoneDDD + this.state.order.customer.Telefone)}`,
                          EntregaEmail: !value ? this.state.order.EntregaEmail : this.state.order.customer.Email,
                          ClienteDocumento: !value ? this.state.order.ClienteDocumento : this.state.order.customer.DocumentoFiscal,
                          ClienteIdentidade: !value ? this.state.order.ClienteIdentidade : this.state.order.customer.Identidade,
                          EntregaCEP: !value ? this.state.order.EntregaCEP : this.state.order.customer.CEP,
                          EntregaMunicipioNome: !value ? this.state.order.EntregaMunicipioNome : this.state.order.customer.MunicipioNome,
                          EntregaUnidadeFederativa: !value ? this.state.order.EntregaUnidadeFederativa : this.state.order.customer.UnidadeFederativa,
                          EntregaLogradouro: !value ? this.state.order.EntregaLogradouro : this.state.order.customer.Logradouro,
                          EntregaLogradouroNumero: !value ? this.state.order.EntregaLogradouroNumero : this.state.order.customer.LogradouroNumero,
                          EntregaBairro: !value ? this.state.order.EntregaBairro : this.state.order.customer.Bairro,
                          EntregaLogradouroComplemento: !value ? this.state.order.EntregaLogradouroComplemento : this.state.order.customer.LogradouroComplemento,
                        }
                      });
                    }}
                    thumbColor={[Platform.OS == 'ios' ? Colors.white : (this.state.order.shippingAdrressSameAsCustomer ? primaryDark : Colors.white)]}
                    trackColor={{
                      false: Colors.lightgray,
                      true: primaryLight
                    }}
                  />
                </Item>
              </View>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Nome</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="person"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaNome}
                  editable={!this.state.order.shippingAdrressSameAsCustomer}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, EntregaNome: text } }) }}
                  autoCapitalize='words'
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Telefone</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="paper-plane"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaTelefone}
                  editable={!this.state.order.shippingAdrressSameAsCustomer}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, EntregaTelefone: text } }) }}
                  keyboardType='number-pad'
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Email</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="mail"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaEmail}
                  editable={!this.state.order.shippingAdrressSameAsCustomer}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, EntregaEmail: text } }) }}
                  keyboardType='email-address'
                  autoCapitalize='none'
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>CEP</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaCEP}
                  editable={!this.state.order.shippingAdrressSameAsCustomer}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, EntregaCEP: text } }) }}
                  keyboardType='number-pad'
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Cidade</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaMunicipioNome}
                  editable={!this.state.order.shippingAdrressSameAsCustomer}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, EntregaMunicipioNome: text } }) }}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Estado</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaUnidadeFederativa}
                  editable={!this.state.order.shippingAdrressSameAsCustomer}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, EntregaUnidadeFederativa: text } }) }}
                  maxLength={2}
                  autoCapitalize='characters'
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Logradouro</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaLogradouro}
                  editable={!this.state.order.shippingAdrressSameAsCustomer}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, EntregaLogradouro: text } }) }}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Número</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaLogradouroNumero}
                  editable={!this.state.order.shippingAdrressSameAsCustomer}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, EntregaLogradouroNumero: text } }) }}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Bairro</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaBairro}
                  editable={!this.state.order.shippingAdrressSameAsCustomer}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, EntregaBairro: text } }) }}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Complemento</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="bookmark"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.EntregaLogradouroComplemento}
                  editable={!this.state.order.shippingAdrressSameAsCustomer}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, EntregaLogradouroComplemento: text } }) }}
                />
              </Item>
            </ScrollView>
          </Tab>
          <Tab
            activeTabStyle={tabStyles.tabs}
            textStyle={tabStyles.tabsText}
            tabStyle={tabStyles.tabs}
            heading="Pagamento"
          >          
            <View style={{ flex: 1 }}>
              <ScrollView style={defaultStyles.container}> 
                <Content
                  contentContainerStyle={styles.content}
                >
                  <Segment style={marginStyles.top10}>
                    <Button
                      first
                      style={[this.state.currentSegment == 'V' ? segmentStyles.segmentActiveButton : segmentStyles.segmentInactiveButton]}
                      onPress={() => {
                        this.setState({
                          currentSegment: 'V'
                        }, () => {
                          this.onRefresh();
                        });
                      }}
                    >
                      <Text
                        style={[this.state.currentSegment == 'V' ? segmentStyles.segmentActiveDetailText : segmentStyles.segmentInactiveDetailText]}
                      >
                        Vista 
                      </Text>
                    </Button>

                    <Button
                      last
                      style={[this.state.currentSegment == 'P' ? segmentStyles.segmentActiveButton : segmentStyles.segmentInactiveButton]}
                      onPress={() => {
                        this.setState({
                          currentSegment: 'P'
                        },  () => {
                          this.onRefresh();
                        });
                      }}
                    >
                      <Text
                        style={[this.state.currentSegment == 'P' ? segmentStyles.segmentActiveDetailText : segmentStyles.segmentInactiveDetailText]}
                      >
                        Prazo     
                      </Text>
                    </Button>
                  </Segment>    
                </Content>           
                <View style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1                 
                }}>                             
                  <Item style={defaultStyles.inputBox} style={{
                    borderColor: 'transparent',
                    marginTop: 15,
                  }}>
                    <Label>Orçamento?</Label>
                    <Switch
                      value={this.state.order.Orcamento}
                      onValueChange={(value) => {
                        this.setState({
                          order: {
                            ...this.state.order,
                            Orcamento: value,
                          }
                        });
                      }}
                      thumbColor={[Platform.OS == 'ios' ? Colors.white : (this.state.order.Orcamento ? primaryDark : Colors.white)]}
                      trackColor={{
                        false: Colors.lightgray,
                        true: primaryLight
                      }}
                    />
                  </Item>
                </View>

                {this.state.order.TipoVenda === 'P' && 
                <Item picker style={defaultStyles.inputBox}>
                  <Label>
                    Parcelamento
                    </Label>
                  <Picker
                    selectedValue={this.state.order.FormaParcelamentoCodigo}
                    onValueChange={(itemValue) => this.parcelMethodChanged(itemValue)}
                  >
                    {parcelMethodsPickerItems}
                  </Picker>
                </Item>
                }
                
                {this.renderPayment()}
              </ScrollView>
              {this.state.order.TipoVenda == 'V' &&
                <View style={{ flex: 1, flexDirection: 'row', }}>
                  <ActionButton
                    buttonColor={primaryDark}
                    onPress={this.addVendaPagamento}
                    title="Add"
                    renderIcon={() => {
                      return (
                        <Icon
                          style={defaultStyles.buttonIcon}
                          name="md-add"
                        />
                      );
                    }}
                  />
                </View>
              }
              <Footer style={footerStyles.footer}>
                <View style={{ ...footerStyles.orderFooter, justifyContent: 'space-between', paddingLeft: 15, paddingRight: 15, }}>
                  <Label style={styles.whiteColorLabel}>Falta / Troco: {formataRealAbsString(this.state.order.ValorPago - this.state.order.ValorTotal)}</Label>
                </View>
              </Footer>
            </View>
          </Tab>
          <Tab
            activeTabStyle={tabStyles.tabs}
            textStyle={tabStyles.tabsText}
            tabStyle={tabStyles.tabs}
            heading="Resumo"
          >
            <ScrollView style={defaultStyles.container}>
              <Item floatingLabel style={defaultStyles.inputBox}>
                <Label>Data e Hora</Label>
                <Input
                  value={`${moment(this.state.order.DataVenda).format('DD/MM/YYYY')} ${moment(this.state.order.HoraVenda).format('HH:mm:ss')}`}
                  editable={false}
                />
              </Item>

              <Item floatingLabel style={defaultStyles.inputBox}>
                <Label>Cliente</Label>
                <Input
                  value={this.state.order.ClienteNome}
                  editable={false}
                />
              </Item>

              {this.state.order.ClienteNome != this.state.order.EntregaNome &&
                <Item floatingLabel style={defaultStyles.inputBox}>
                  <Label>Nome de Entrega</Label>
                  <Input
                    value={this.state.order.EntregaNome}
                    editable={false}
                  />
                </Item>
              }

              <Item floatingLabel style={defaultStyles.inputBox}>
                <Label>Transportadora</Label>
                <Input
                  value={this.state.order.TransportadoraNome}
                  editable={false}
                />
              </Item>

              <Item floatingLabel style={defaultStyles.inputBox}>
                <Label>Forma de Parcelamento</Label>
                <Input
                  value={this.state.order.FormaParcelamentoNome}
                  editable={false}
                />
              </Item>

              <Item floatingLabel style={defaultStyles.inputBox}>
                <Label>Itens no carrinho</Label>
                <Input
                  value={Number(this.state.order.QuantidadeTotal).toString()}
                  editable={false}
                />
              </Item>

              <Item floatingLabel style={defaultStyles.inputBox}>
                <Label>Valor Bruto</Label>
                <Input
                  value={`${formataRealString(this.state.order.ValorTotalBruto)}`}
                  editable={false}
                />
              </Item>

              <Item floatingLabel style={defaultStyles.inputBox}>
                <Label>Desconto</Label>
                <Input
                  value={`${formataNumberString(this.state.order.ValorDesconto)}%`}
                  editable={false}
                />
              </Item>

              <Item floatingLabel style={defaultStyles.inputBox}>
                <Label>Desconto (Valor)</Label>
                <Input
                  value={`${formataRealString(this.state.order.ValorDescontoValor)}`}
                  editable={false}
                />
              </Item>


              <Item floatingLabel style={defaultStyles.inputBox}>
                <Label>Valor Total</Label>
                <Input
                  value={formataRealString(this.state.order.ValorTotal)}
                  editable={false}
                />
              </Item>

              <Item stackedLabel style={defaultStyles.inputBox}>
                <Label>Observações</Label>
                <Icon
                  style={defaultStyles.inputBoxIcon}
                  name="clipboard"
                />
                <Input
                  style={defaultStyles.inputBoxText}
                  value={this.state.order.Observacoes}
                  onChangeText={(text) => { this.setState({ order: { ...this.state.order, Observacoes: text } }) }}
                />
              </Item>

              {this.state.order.Troco > 0 &&
                <Item floatingLabel style={defaultStyles.inputBox}>
                  <Label>Troco</Label>
                  <Input
                    value={formataRealString(this.state.order.Troco)}
                    editable={false}
                  />
                </Item>
              }
          
            </ScrollView>
            <ActionButton
                buttonColor={primaryDark}
                onPress={this.handleSaveData}
                title="Save"
                renderIcon={() => {
                  return (
                    <Icon name="cart" style={defaultStyles.buttonIcon} />
                  );
                }}
              />
          </Tab>
        </Tabs>
      );
    } else {
      return (
        <View style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
        }}>
          {
            this.state.animationName == 'success' &&
            <View style={defaultStyles.centerContentContainer}>
              <LottieView
                source={require('../../../assets/animations/success.json')}
                style={animationStyles.animation}
                resizeMode="cover"
                autoPlay
              />
              <Label style={[defaultStyles.textHeader, defaultStyles.textCenter]}>
                Pronto!
              </Label>
            </View>
          }
          {
            this.state.animationName == 'error' &&
            <View style={defaultStyles.centerContentContainer}>
              <LottieView
                source={require('../../../assets/animations/error.json')}
                style={animationStyles.animation}
                resizeMode="cover"
                autoPlay
              />
              <Label style={[defaultStyles.textHeader, defaultStyles.textCenter]}>
                A venda não foi enviada.
              </Label>
            </View>
          }
          {
            this.state.animationName == 'sending_request' &&
            <View style={defaultStyles.centerContentContainer}>
              <LottieView
                source={require('../../../assets/animations/sending_request.json')}
                style={animationStyles.animation}
                resizeMode="cover"
                autoPlay
              />
              <Label style={[defaultStyles.textHeader, defaultStyles.textCenter]}>
                Enviando venda...
              </Label>
            </View>
          }
        </View>
      );
    }
  }

  changeOrderFieldArrayValue = (arrayName, arrayField, updateField, item, itemValue) => {
    const index = this.state.order[arrayName].findIndex(i => i[arrayField] == item[arrayField]);
    const order = this.state.order;

    const newArray = [
      ...order[arrayName].slice(0, index),
      {
        ...order[arrayName][index],
        [updateField]: itemValue,
      },
      ...order[arrayName].slice(index + 1)
    ];

    this.setState({
      order: update(order, {
        [arrayName]: {
          $set: newArray,
        }
      })
    });
  }

  changeOrderArrayValue = (arrayName, arrayField, itemValue) => {
    const oldArray = this.state.order[arrayName];
    const order = this.state.order;
    let newArray = [];
    oldArray.forEach(element => {
      newArray.push(
        {
          ...element,
          [arrayField]: itemValue,
        }
      )
    });
    this.setState({
      order: update(order, {
        [arrayName]: {
          $set: newArray,
        }
      })
    });
  }

  renderPayment = () => {
    // if (this.state.order.Orcamento) {
    //   return;
    // }

    const paymentMethods = this.state.order.TipoVenda == 'P' ? this.state.paymentMethodsAPrazo : this.state.paymentMethodsAVista;
    let allPaymentMethodsPickerItems = this.state.paymentMethods.map((paymentMethod) => {
      return <Picker.Item key={paymentMethod.Codigo} value={paymentMethod.Codigo} label={paymentMethod.Nome} />
    });

    let paymentMethodsPickerItems = paymentMethods.map((paymentMethod) => {
      return <Picker.Item key={paymentMethod.Codigo} value={paymentMethod.Codigo} label={paymentMethod.Nome} />
    });

    if (this.state.order.TipoVenda == 'P') {
      return (
        <View style={[defaultStyles.container]}>
          <View style={[{ flexDirection: 'column' }, marginStyles.bottom10]} >
            <Item picker style={[defaultStyles.inputBox, {
              marginLeft: 15,
              marginRight: 15,
              marginBottom: 10,
            }]}>
              <Label>
                Pagamento principal
              </Label>
              <Picker
                onValueChange={(itemValue) => {
                  this.setState({ order: { ...this.state.order, CodigoFormaPagamento: itemValue } });
                  setTimeout(() => { this.changeOrderArrayValue('Parcelas', 'CodigoFormaPagamento', itemValue); }, 250);
                }}
                placeholder='Selecione uma forma de pagamento'
                selectedValue={this.state.order.CodigoFormaPagamento}
              >
                {paymentMethodsPickerItems}
              </Picker>
            </Item>

            <View style={[{ ...styles.paymentHeader, marginTop: 15 }]}>
              <Col style={{ width: '35%' }}>
                <Label style={[defaultStyles.textLeft, { fontSize: 14 }]}>Vencimento</Label>
              </Col>
              <Col style={{ width: '35%' }}>
                <Label style={[defaultStyles.textCenter, { fontSize: 14 }]}>Número</Label>
              </Col>
              <Col style={{ width: '30%' }}>
                <Label style={[defaultStyles.textRight, { fontSize: 14 }]}>Valor</Label>
              </Col>
            </View>
          </View>

          <FlatList
            keyExtractor={(item) => { return item.Numero }}
            data={this.state.order.Parcelas}
            renderItem={({ item }) => {
              return (
                <ListItem style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <View style={{ ...styles.paymentHeader, marginRight: 0, marginLeft: 0, }} >
                    <Col style={{ width: '40%' }}>
                      <Label style={[defaultStyles.textLeft, { fontSize: 14 }]}>
                        {formataDataString(item.DataVencimento)}
                      </Label>
                    </Col>
                    <Col style={{ width: '30%' }}>
                      <Label style={[defaultStyles.textCenter, { fontSize: 14 }]}>
                        {item.Numero}
                      </Label>
                    </Col>
                    <Col style={{ width: '30%' }}>
                      <Label style={[defaultStyles.textRight, { fontSize: 14 }]}>
                        {formataRealString(item.Valor)}
                      </Label>
                    </Col>
                  </View>
                  <Item picker style={defaultStyles.inputBox}>
                    <Label>
                      Pagamento por
                    </Label>
                    <Picker
                      onValueChange={(itemValue) => this.changeOrderFieldArrayValue('Parcelas', 'Numero', 'CodigoFormaPagamento', item, itemValue)}
                      placeholder='Selecione uma forma de pagamento'
                      selectedValue={item.CodigoFormaPagamento}
                    >
                      {this.state.order.parcelMethod.DiasInicial == 0 && item.Numero.substring(0, 2) == '01' ? allPaymentMethodsPickerItems : paymentMethodsPickerItems}
                    </Picker>
                  </Item>
                </ListItem>
              )
            }}
          />
        </View>
      );
    } else {
      return (
        <View style={[defaultStyles.container]}>
          <View style={{ ...styles.paymentHeader, marginTop: 15 }}>
            <Col style={{ width: '50%' }}>
              <Label style={{ fontSize: 14 }}>Forma de Pagamento</Label>
            </Col>
            <Col style={{ width: '40%' }}>
              <Label style={[defaultStyles.textCenter, { fontSize: 14 }]}>Valor</Label>
            </Col>
            <Col style={{ width: '10%' }}>
            </Col>
          </View>
          <FlatList
            style={[defaultStyles.container]}
            keyExtractor={(item) => { return item.uuid }}
            data={this.state.order.VendaPagamentos}
            renderItem={({ item }) => {
              return (
                <ListItem style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                  <Col style={{ width: '50%' }}>
                    <Item picker>
                      <Picker
                        onValueChange={(itemValue) => this.changeOrderFieldArrayValue('VendaPagamentos', 'uuid', 'FormaPagamentoCodigo', item, itemValue)}
                        placeholder='Selecione uma forma de pagamento'
                        selectedValue={item.FormaPagamentoCodigo}
                      >
                        {paymentMethodsPickerItems}
                      </Picker>
                    </Item>
                  </Col>
                  <Col style={{ width: '40%' }}>
                    <TextInputMask
                      style={defaultStyles.textCenter}
                      includeRawValueInChangeText
                      value={item.Valor}
                      type={'money'}
                      onChangeText={(value, rawValue) => {
                        this.changeOrderFieldArrayValue('VendaPagamentos', 'uuid', 'Valor', item, rawValue);
                        setTimeout(() => { this.calculateValorPago() }, 500);
                      }}
                    />
                  </Col>
                  <Col style={{ width: '10%' }}>
                    <Button icon transparent onPress={() => { this.vendaPagamentoOptions(item) }} >
                      <Icon name='md-more' />
                    </Button>
                  </Col>
                </ListItem>
              )
            }
            }
          />
        </View>
      );
    }
  }

  vendaPagamentoOptions = (item) => {
    ActionSheet.show(
      {
        options: ['Preencher', 'Excluir', 'Cancel'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
        title: "Modificar pagamento"
      },
      buttonIndex => {
        switch (buttonIndex) {
          case 0:
            const diferenca = this.state.order.ValorPago - this.state.order.ValorTotal;
            if (diferenca >= 0) {
              return;
            }
            this.changeOrderFieldArrayValue('VendaPagamentos', 'uuid', 'Valor', item, diferenca * -1);
            setTimeout(() => { this.calculateValorPago() }, 500);
            break;

          case 1:
            let vendaPagamentos = this.state.order.VendaPagamentos.filter(element => element.uuid !== item.uuid);
            if (vendaPagamentos.length == 0) {
              vendaPagamentos = this.createVendaPagamentos();
            }
            this.setState({
              order: update(this.state.order, {
                VendaPagamentos: {
                  $set: vendaPagamentos,
                }
              })
            });
            setTimeout(() => { this.calculateValorPago() }, 500);
            break;

          default:
            break;
        }
      }
    )
  }

  calculateValorPago = () => {
    let valorPago = 0;
    this.state.order.VendaPagamentos.forEach((item) => {
      valorPago += item.Valor;
    });
    let valorTroco = 0;
    if (valorPago > this.state.order.ValorTotal) {
      valorTroco = valorPago - this.state.order.ValorTotal;
    }
    this.setState({
      order: {
        ...this.state.order,
        Troco: valorTroco,
        ValorPago: valorPago,
      }
    });
  }

  createVendaPagamento = () => {
    return {
      uuid: genUUID(),
      Valor: 0,
      FormaPagamentoCodigo: 1,
    };
  }

  createVendaPagamentos = () => {
    return [
      {
        uuid: genUUID(),
        Valor: 0,
        FormaPagamentoCodigo: 1,
      }
    ];
  }

  addVendaPagamento = async () => {
    const vendaPagamento = this.createVendaPagamento();
    await this.setState({
      order: {
        ...this.state.order,
        VendaPagamentos: [
          ...this.state.order.VendaPagamentos,
          vendaPagamento
        ]
      }
    })
  }

  handleSaveData = async () => {
    
    localStorage.setValueAsync('data.leuEstoque', 'false');

    if (this.state.order.Codigo) {
      Alert.alert(
        'Venda já enviada',
        'Não é possível atualizar esta venda pois ela já foi enviada para o ERP. Em caso de alteração ou cancelamento, estas ações devem ser feitas no ERP.',
        [
          {
            text: 'Ok',
          },
        ],
        {
          cancelable: false
        },
      );
      return;
    }

    let listaProdutosSemEstoque = [];
    let semEstoque = false;
    let errors = [];
    if (!this.state.order.Orcamento) {
      this.state.order.Itens.map(async (produto) => {
        delete produto.Imagem
        await masterApi.getEstoquePorProdutoAsync(produto.ProdutoCodigo)
          .then(response => {
            if (produto.Quantidade > response.data.Model.Estoque.EstoqueAtual) {
              listaProdutosSemEstoque.push(produto.ProdutoCodigo)
            }
          })

        
      })
    }

    console.log(JSON.stringify(this.state.order.Itens))

    if (listaProdutosSemEstoque.length > 1) {
      toastWrapper.showToast(`Os produtos de códigos ${listaProdutosSemEstoque.reverse().join(', ')} não possuem estoque no Master.`);
      semEstoque = true;
    }
    else if (listaProdutosSemEstoque.length == 1) {
      toastWrapper.showToast(`O produto de código ${listaProdutosSemEstoque} não posui estoque no Master.`);
      semEstoque = true;
    }

    if (this.state.order.Itens.length == 0) {
      errors.push('A venda não possui itens.');
    }

    if (!this.state.order.Orcamento && (this.state.order.ValorPago < this.state.order.ValorTotal)) {
      errors.push('A venda não está paga.');
    }

    if (this.state.order.Orcamento && (!this.state.order.ValorPago || this.state.order.ValorPago == 0)) {
      this.setState({
        order: {
          ...this.state.order,
          Parcelas: [],
          VendaPagamentos: [],
        }
      });
    }
 
    if (errors.length > 0) {
      Alert.alert(
        'Venda inválida',
        breakLineText(errors),
        [
          {
            text: 'Ok',
          },
        ],
        {
          cancelable: false
        },
      );
      return;
    }

    this.callAnimation('sending_request', false);

    await setTimeout(async () => {
      this.state.order.Sincronizado = false;
      let animationName = '';

      if (!semEstoque) {
        await orderController.sendOrderAsync(this.state.order)
          .then(() => {
            animationName = 'success';
          })
          .catch(() => {
            animationName = 'error';
          });
      }
      else {
        animationName = 'error';
      }

      await firestoreWrapper.postOrderAsync(this.state.order);
      this.props.setHasUpdate(true);

      this.callAnimation(animationName, true);
    }, 500);
  }
}

const styles = StyleSheet.create({
  content:{
    justifyContent: 'center',
    alignItems: 'center'
  },
  paymentHeader: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginLeft: 15,
    marginRight: 15,
  },
  whiteColorLabel: {
    color: 'white',
  },
});

const mapStateToProps = (state, ownProps) => ({
  activeRoute: state.routes.activeRoute,
  routes: state.routes.routes,
  showMenu: ownProps.showMenu,
  goBack: ownProps.goBack,
  selectedOrder: state.orders.selectedOrder,
  selectedProduct: state.products.selectedProduct,
  selectedCustomer: state.customers.selectedCustomer,
  viewAction: state.routes.viewAction,
  viewActionPai: state.routes.viewActionPai,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(Actions, dispatch);
;

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OrderDetails);