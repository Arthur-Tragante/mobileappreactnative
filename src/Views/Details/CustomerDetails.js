import update from 'immutability-helper';
import tabStyles from '../../styles/Tabs';
import React from "react";
import { ScrollView, View, Alert, Platform } from "react-native";
import { connect } from "react-redux";
import defaultStyles from '../../styles';
import { primaryDark, primaryLight } from '../../global.styles';
import ActionButton from 'react-native-action-button';
import LottieView from 'lottie-react-native';
import firestoreWrapper from '../../services/FirestoreWrapper';
import animationStyles from '../../styles/Animations';
import * as Actions from "../../Redux/actions";
import { bindActionCreators } from "redux";
import { Tab, Tabs, ScrollableTab, Item, Icon, Label, Input, Picker, Switch, } from 'native-base';
import { genUUID, validarDocumentoFiscal, breakLineText } from '../../utils';
import customerController from '../../services/Controllers/CustomerController';
import Colors from '../../styles/Colors';
import dataStorage from "../../services/DataStorage";

class CustomerDetails extends React.Component {
  constructor(props) {
    super(props);

    let customer = this.props.selectedCustomer || {
      uuid: genUUID(),
      TipoPessoa: 'F',
      Codigo: 0,
    };

    this.state = {
      changed: this.props.selectedCustomer != null && this.props.selectedCustomer.Sincronizado !== true,
      creating: this.props.selectedCustomer == null,
      animationChangePage: false,
      showingAnimation: false,
      customer: customer,
      animationName: '',
    };
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

  componentDidUpdate() {
    if (this.state.animationChangePage) {
      this.props.setRunningAnimation(false);
      this.props.popActiveRoute();
    }
  }

  render() {
    if (!this.state.showingAnimation) {
      return (
        <View style={defaultStyles.container}>
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
              heading="Informações"
            >
              <ScrollView style={defaultStyles.container}>
                {
                  this.state.customer.Codigo != 0 &&
                  <Item stackedLabel style={defaultStyles.inputBox}>
                    <Label>Código</Label>
                    <Icon
                      style={defaultStyles.inputBoxIcon}
                      name="text"
                    />
                    <Input
                      value={this.state.customer.Codigo ? this.state.customer.Codigo.toString() : ''}
                      editable={false}
                    />
                  </Item>
                }

                <Item picker style={defaultStyles.inputBox}>
                  <Picker
                    selectedValue={this.state.customer.TipoPessoa}
                    iosIcon={<Icon name="arrow-down" />}
                    style={{ width: undefined }}
                    placeholder="Tipo"
                    mode="dropdown"
                    onValueChange={(itemValue) => this.setState({ customer: { ...this.state.customer, TipoPessoa: itemValue }, changed: true })}
                  >
                    <Picker.Item label="Física" value="F" />
                    <Picker.Item label="Jurídica" value="J" />
                  </Picker>
                </Item>

                {
                  this.state.customer.TipoPessoa == "J" &&
                  <View style={defaultStyles.container}>
                    <View style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      flex: 1,
                    }}>
                      <Item style={defaultStyles.inputBox} style={{
                        borderColor: 'transparent',
                        marginTop: 15,
                      }}>
                        <Label>É revenda?</Label>
                        <Switch
                          value={this.state.customer.TipoDestinatario == "R"}
                          onValueChange={(value) => {
                            this.setState({
                              customer: update(this.state.customer, {
                                TipoDestinatario: {
                                  $set: value ? 'R' : '',
                                }
                              })
                            });
                          }}
                          thumbColor={[Platform.OS == 'ios' ? Colors.white : (this.state.customer.TipoDestinatario == "R" ? primaryDark : Colors.white)]}
                          trackColor={{
                            false: Colors.lightgray,
                            true: primaryLight
                          }}
                        />
                      </Item>
                    </View>

                    <Item stackedLabel style={defaultStyles.inputBox}>
                      <Label>Razão social</Label>
                      <Icon
                        style={defaultStyles.inputBoxIcon}
                        name="person"
                      />
                      <Input
                        onChangeText={(text) => this.setState({ customer: { ...this.state.customer, RazaoSocial: text }, changed: true })}
                        value={this.state.customer.RazaoSocial}
                      />
                    </Item>
                  </View>
                }

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>Nome</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="person"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, Nome: text }, changed: true })}
                    value={this.state.customer.Nome}
                    autoCapitalize='words'
                    blurOnSubmit={false}
                    returnKeyType='next'
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>DDD</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="paper-plane"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, TelefoneDDD: text }, changed: true })}
                    value={this.state.customer.TelefoneDDD}
                    keyboardType='numeric'
                    maxLength={2}
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>Telefone</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="paper-plane"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, Telefone: text }, changed: true })}
                    value={this.state.customer.Telefone}
                    keyboardType='numeric'
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>Email</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="mail"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, Email: text }, changed: true })}
                    value={this.state.customer.Email}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    autoCorrect={false}
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>{this.state.customer.TipoPessoa == 'F' ? 'CPF' : 'CNPJ'}</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="person"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, DocumentoFiscal: text }, changed: true })}
                    value={this.state.customer.DocumentoFiscal}
                    keyboardType='numeric'
                    maxLength={14}
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>{this.state.customer.TipoPessoa == 'F' ? 'RG' : 'IE'}</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="person"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, Identidade: text }, changed: true })}
                    value={this.state.customer.Identidade}
                  />
                </Item>
              </ScrollView>
            </Tab>
            <Tab
              activeTabStyle={tabStyles.tabs}
              textStyle={tabStyles.tabsText}
              tabStyle={tabStyles.tabs}
              heading="Endereço"
            >
              <ScrollView style={defaultStyles.container}>
                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>CEP</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="bookmark"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, CEP: text }, changed: true })}
                    value={this.state.customer.CEP}
                    keyboardType='numeric'
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>Estado</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="bookmark"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, UnidadeFederativa: text }, changed: true })}
                    value={this.state.customer.UnidadeFederativa}
                    maxLength={2}
                    autoCapitalize='characters'
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>Cidade</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="bookmark"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, MunicipioNome: text }, changed: true })}
                    value={this.state.customer.MunicipioNome}
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>Logradouro</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="bookmark"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, Logradouro: text }, changed: true })}
                    value={this.state.customer.Logradouro}
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>Número</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="bookmark"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, LogradouroNumero: text }, changed: true })}
                    value={this.state.customer.LogradouroNumero}
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>Bairro</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="bookmark"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, Bairro: text }, changed: true })}
                    value={this.state.customer.Bairro}
                  />
                </Item>

                <Item stackedLabel style={defaultStyles.inputBox}>
                  <Label>Complemento</Label>
                  <Icon
                    style={defaultStyles.inputBoxIcon}
                    name="bookmark"
                  />
                  <Input
                    onChangeText={(text) => this.setState({ customer: { ...this.state.customer, LogradouroComplemento: text }, changed: true })}
                    value={this.state.customer.LogradouroComplemento}
                  />
                </Item>
              </ScrollView>
            </Tab>
          </Tabs>
          {
            this.state.changed &&
            <ActionButton
              buttonColor={primaryDark}
              onPress={this.handleSaveData}
              title="Save"
              renderIcon={() => {
                return (
                  <Icon name="md-save" style={defaultStyles.buttonIcon} />
                );
              }}
            />
          }
        </View >
      );
    }
    else {
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
                O cliente não foi enviado.
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
                Enviando cliente...
              </Label>
            </View>
          }
        </View>
      );
    }
  }

  handleSaveData = async () => {
    let errors = [];
    let customers = [];
    let updatedCustomer = {};

    if (this.state.customer.Nome && this.state.customer.Nome == '') {
      errors.push('Nome vazio');
    }

    if (this.state.customer.DocumentoFiscal && this.state.customer.DocumentoFiscal == '') {
      if (this.state.customer.TipoPessoa == 'F') {
        errors.push('CPF vazio');
      } else {
        errors.push('CNPJ vazio');
      }
    } else if (this.state.customer.DocumentoFiscal && !validarDocumentoFiscal(this.state.customer.DocumentoFiscal)) {
      if (this.state.customer.TipoPessoa == 'F') {
        errors.push('CPF inválido');
      } else {
        errors.push('CNPJ inválido');
      }
    }

    if (this.state.customer.TipoPessoa && this.state.customer.TipoPessoa == 'J' && this.state.customer.Identidade && this.state.customer.Identidade == '') {
      errors.push('IE vazio');
    }

    if (errors.length > 0) {
      Alert.alert(
        'Cliente inválido',
        'As informações do cliente estão inválidas: \n' + breakLineText(errors),
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
      this.state.customer.Sincronizado = false;
      let animationName = '';

      await customerController.sendCustomerAsync(this.state.customer)
        .then(() => {
          animationName = 'success';
        })
        .catch(() => {
          animationName = 'error';
        });
      
      customers = await dataStorage.getStoredCustomersAsync();

      updatedCustomer = customers.findIndex(customer => customer.Codigo == this.state.customer.Codigo);
      
      if (updatedCustomer > 0) {
        customers[updatedCustomer] = this.state.customer;
      } else {
        customers.push(this.state.customer);
      }
      await dataStorage.setStoredCustomersAsync(customers);
            
      await firestoreWrapper.postCustomerAsync(this.state.customer);
      this.props.setHasUpdate(true);

      this.callAnimation(animationName, true);
    }, 500);
  }
}

const mapStateToProps = (state, ownProps) => ({
  selectedCustomer: state.customers.selectedCustomer,
  activeRoute: state.routes.activeRoute,
  routes: state.routes.routes,
  showMenu: ownProps.showMenu,
  goBack: ownProps.goBack,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(Actions, dispatch);
;

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomerDetails);
