import React from "react";
import { View, Platform, TextInput } from "react-native";
import { Item, Label, Switch, Left, Right, Toast } from "native-base";
import { primaryDark, primaryLight } from "../global.styles";
import Colors from "../styles/Colors";
import defaultStyles from "../styles";
import * as Actions from "../Redux/actions";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import PropTypes from "prop-types";
import firestoreWrapper from "../services/FirestoreWrapper";
import dataStorage from "../services/DataStorage";
import ActionButton from "react-native-action-button";
import LottieView from 'lottie-react-native';
import animationStyles from "../styles/Animations";
import masterApi from "../services/MasterApi";
import { FlatList } from "react-native-gesture-handler";
import Icon from 'react-native-vector-icons/Ionicons';
import backgroundServices from "../services/BackgroundServices";
import localStorage from "../services/LocalStorage";


class Settings extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      settingsValues: {
        Acoes: []
      },
      animationChangePage: false,
      showingAnimation: false,
      acoesMobile: [29, 35],
    };
  }
  
  static propTypes = {
    activeRoute: PropTypes.shape({
      name: PropTypes.string.isRequired,
      screen: PropTypes.any.isRequired,
      icon: PropTypes.string
    }).isRequired,
    routes: PropTypes.arrayOf(PropTypes.object).isRequired,
    navigateTo: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.loadSettingsAsync();
  }

  componentDidUpdate() {
    const {animationChangePage} = this.state;

    if (animationChangePage) {
      this.props.setRunningAnimation(false);
      this.props.popActiveRoute();
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

  loadSettingsAsync = async () => {
    let settingsValues = this.state.settingsValues || {};
    
    settingsValues = await dataStorage.getStoredSettingsAsync().then(async storedSettings => {
      if (!storedSettings || storedSettings.Acoes.length == 0) {
        settingsValues = await firestoreWrapper.getSettingsAsync() || {};
      } else {
        settingsValues = storedSettings;
      }
    })
    .finally(() => {
      this.setState({
        settingsValues: settingsValues
      });    
    });

    let endpoint = this.state.endpoint || 'não definido';
    endpoint = await localStorage.getValueAsync('master.api.endpoint').then(async value => {
      endpoint = value;
    })
    .finally(() => this.setState({
        ...this.state,
        endpoint: endpoint
      })
    );
  };

  handleGetAcoes = async () => {
    let response = await masterApi.getAcoesAsync();
    let acoes = response.data && response.data.Acoes || [];

    this.setState({
      settingsValues: acoes
    });

    await firestoreWrapper.postSettingsAsync(acoes);
    await dataStorage.setStoredSettingsAsync(acoes);    
  };

  handleGetImages = async () => {
    backgroundServices.handleImagesSyncFromMasterApiAsync();
  }

  handleEndpointChange = async(value) => {
    await localStorage.setValueAsync('master.api.endpoint', value);
  }

  render() {
    const { Acoes } = this.state.settingsValues;
    
    if (!this.state.showingAnimation) {
      return (
        <View style={{
          flex: 1,
        }}>
          <FlatList
            style={{
              flexGrow: 0,
              marginBottom: 20
            }}
            data={Acoes.filter(s => this.state.acoesMobile.includes(s.Codigo))}
            keyExtractor={item=>item.Codigo}
            renderItem={({item}) => {
              return (
                <View key={item.Codigo}>
                  <Item style={defaultStyles.inputBox} 
                          style={{
                            borderColor: 'transparent',
                            marginTop: 15,
                          }}>
                    <Left>
                      <Label>{item.Nome}</Label>
                    </Left>
                    <Right>
                      <Switch
                        disabled={true}
                        value={item.Permitido}
                        thumbColor={[Platform.OS == 'ios' ? Colors.white : (item.Permitido ? primaryDark : Colors.white)]}
                        trackColor={{
                          false: Colors.lightgray,
                          true: primaryLight
                        }}
                      />
                    </Right>                  
                  </Item>
                </View>
              );
            }}
          >
          </FlatList>
          <View style={{
            flex: 1,
          }}>
            <Label>Endpoint</Label>
            <TextInput
              editable={true}
              defaultValue={this.state.endpoint}
              onChangeText={(text) => this.handleEndpointChange(text)}
            />
          </View>
          <ActionButton
            buttonColor={primaryDark}
            renderIcon={() => {
              return (
                <Icon name="md-download" style={defaultStyles.buttonIcon} />
              );
            }}
          >
            <ActionButton.Item buttonColor='#9b64a2' title="Baixar Fotos de Produtos" onPress={this.handleGetImages}>
              <Icon name="md-photos" style={defaultStyles.buttonIcon} />
            </ActionButton.Item>
            
            <ActionButton.Item buttonColor='#6472a2' title="Baixar Permissões de Usuário" onPress={this.handleGetAcoes}>
              <Icon name="md-contacts" style={defaultStyles.buttonIcon} />
            </ActionButton.Item>
          </ActionButton>
        </View>
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
                source={require('../../assets/animations/success.json')}
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
                source={require('../../assets/animations/error.json')}
                style={animationStyles.animation}
                resizeMode="cover"
                autoPlay
              />
              <Label style={[defaultStyles.textHeader, defaultStyles.textCenter]}>
                As configurações não foram enviadas.
              </Label>
            </View>
          }
          {
            this.state.animationName == 'sending_request' &&
            <View style={defaultStyles.centerContentContainer}>
              <LottieView
                source={require('../../assets/animations/sending_request.json')}
                style={animationStyles.animation}
                resizeMode="cover"
                autoPlay
              />
              <Label style={[defaultStyles.textHeader, defaultStyles.textCenter]}>
                Enviando configurações...
              </Label>
            </View>
          }
        </View>
      );
    }      
  }

}

const mapStateToProps = (state) => ({
  activeRoute: state.routes.activeRoute,
  routes: state.routes.routes,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(Actions, dispatch);
;

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings);