import backgroundServices from "../services/BackgroundServices";
import { View, Dimensions, Image, Text } from "react-native";
import firestoreWrapper from '../services/FirestoreWrapper';
import LoadingMessages from '../constants/LoadingMessages';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icon from 'react-native-vector-icons/Feather';
import localStorage from '../services/LocalStorage';
import toastWrapper from "../services/ToastWrapper";
import animationStyles from '../styles/Animations';
import DeviceInfo from 'react-native-device-info';
import dataStorage from "../services/DataStorage";
import AppConfig from '../constants/AppConfig';
import masterApi from '../services/MasterApi';
import firebase from 'react-native-firebase';
import LottieView from 'lottie-react-native';
import * as Actions from "../Redux/actions";
import { bgHeader } from '../global.styles';
import cameraStyles from '../styles/Camera';
import { bindActionCreators } from "redux";
import { getCommaText } from '../utils';
import defaultStyles from '../styles';
import { connect } from "react-redux";
import LoadingScreen from './Loading';
import base64 from 'base-64';
import React from "react";

class SetupScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loadingMessagesHandlerInterval: null,
      animationChangePage: false,
      showingAnimation: false,
      loadingMessage: '',
      qrJson: {},
      index: 0,
    }

    this.credentials = {
    }
  }

  handleLoadingMessages() {
    this.setState({
      loadingMessage: LoadingMessages.getRandomLoadingMessage(),
    });

    loadingMessagesHandlerInterval = setInterval(() => {
      this.setState({
        loadingMessage: LoadingMessages.getRandomLoadingMessage(),
      });
    }, 3000);
  };

  callAnimation() {
    this.setState({
      showingAnimation: true,
    });

    this.props.setRunningAnimation(true);

    setTimeout(() => {
      this.setState({
        animationChangePage: true,
      });
    }, 2400);
  }

  async componentDidMount() {
    await localStorage.clearStorageAsync();
    this.props.setValidateSession(false);
  }

  componentWillUnmount() {
    this.props.setValidateSession(true);
  }

  componentDidUpdate() {
    if (this.state.animationChangePage) {
      this.props.setRunningAnimation(false);

      this.setState({
        animationChangePage: false,
      });

      this.props.setHasUpdate(true);
      this.props.navigation.replace('Splash');
    }
  }

  async handleLoginSync() {
    let success = false;

    await this.handleLocalStorageSync();
    const masterApiSyncSuccess = await this.handleMasterApiSync();

    if (masterApiSyncSuccess) {
      await this.handleFirebaseLogin();
      success = true;
    }

    return success;
  }

  async handleFirebaseLogin() {
    await firebase
      .auth()
      .signInWithEmailAndPassword(qrJson.email, AppConfig.USER_TOKEN)
      .then(async credentials => {
        this.credentials = credentials;
        success = await this.handleFirestoreSync();
      })
      .catch(async () => {
        await firebase
          .auth()
          .createUserWithEmailAndPassword(qrJson.email, AppConfig.USER_TOKEN)
          .then(async credentials => {
            this.credentials = credentials;
            success = await this.handleFirestoreSync();
          })
          .catch(async error => {
            await firebase.auth().signOut();
            await localStorage.clearStorageAsync();
            await firestoreWrapper.saveErrorAsync('setup_firebase_auth', error);

            if (__DEV__) {
              alert(`Erro no login do Firestore: ${error}`);
            }
            else {
              switch (error) {
                case 'Error: The email address is already in use by another account.':
                  alert('Esse código QR já está em uso, crie um novo com outro usuário no Master.')
                  break;

                default:
                  alert('Ops! Parece que tivemos um erro ao configurar sua conta. Por favor tente novamente ou entre em contato com nosso suporte.');
                  break;
              }
            }
          });
      });
  }

  async handleFirestoreSync() {
    await localStorage.setValueAsync('user.id', this.credentials.user.uid);

    await firebase.firestore()
      .collection('users')
      .doc(this.credentials.user.uid)
      .get()
      .then(async snapshot => {
        let userData = snapshot.data();
        if (userData) {
          const orders = await firestoreWrapper.getOrdersAsync();

          if (orders && orders.length) {
            await dataStorage.setStoredOrdersAsync(orders);
          }
        }
        else {
          await firebase.firestore()
            .collection('users')
            .doc(this.credentials.user.uid)
            .set({
              userEmail: qrJson.email,
              userName: qrJson.user,
            })
            .then(() => {
            })
            .catch(error => {
            });
        }

        await backgroundServices.handleCustomersSyncFromMasterApiAsync();
      })
      .catch(async error => {
        await firestoreWrapper.saveErrorAsync('setup_firebase_sync', error);
        success = false;
      });
  }

  async handleLocalStorageSync() {
    await localStorage.setValueAsync('master.api.endpoint', qrJson.host);
    await localStorage.setValueAsync('master.api.token', qrJson.token);
    await localStorage.setValueAsync('user.email', qrJson.email);
    await localStorage.setValueAsync('user.name', qrJson.user);
    await localStorage.setValueAsync('user.codigo', qrJson.codigo);
  }

  async handleMasterApiSync() {
    let errors = [];

    await masterApi.getAcoesAsync()
      .then(async response => {
        const settings = response.data.Acoes;
        await localStorage.setValueAsync('data.settings', settings);
      })
      .catch(() => {
        errors.push('ações');
      });

    await masterApi.getFormasPagamentoAsync()
      .then(async response => {
        const paymentMethods = response.data.formas_pgto;
        await localStorage.setValueAsync('data.paymentMethods', paymentMethods);
      })
      .catch(() => {
        errors.push('formas de pagamento');
      });

      

    if (errors.length == 0) {
      await masterApi.getFormasParcelamentoAsync()
        .then(async response => {
          const parcelMethods = response.data.parcelamento;
          await localStorage.setValueAsync('data.parcelMethods', parcelMethods);
          await localStorage.setValueAsync('data.parcelMethod.aVista', this.getParcelMethodAVista(parcelMethods));
        })
        .catch(() => {
          errors.push('formas de parcelamento');
        });
    }

    if (errors.length == 0) {
      await masterApi.getTransportadorasAsync()
        .then(async response => {
          const carriers = response.data.transportadora;
          await localStorage.setValueAsync('data.carriers', carriers);
        })
        .catch(() => {
          errors.push('transportadoras');
        });
    }

    if (errors.length > 0) {
      toastWrapper.showToast(`Erro na sincronização de ${getCommaText(errors)}.`);
      return false;
    }

    await backgroundServices.handleProductsSyncFromMasterApiAsync();
    
    return true;
  }

  getParcelMethodAVista = parcelMethods => {
    let parcelMethod = {};

    parcelMethods.forEach((item) => {
      if (item.Nome.trim().toUpperCase() == 'A VISTA' && item.Quantidade == 0) {
        parcelMethod = item;
        return;
      }
    });

    parcelMethods.forEach((item) => {
      if (item.Quantidade == 0) {
        parcelMethod = item;
        return;
      }
    });

    return parcelMethod;
  }

  async onSuccess(e) {
    try {
      let rawJson = base64.decode(e.data);
      console.log(rawJson);
      //let rawJson = base64.decode('eyJ1c2VyIjoicmVubmFuIiwiZW1haWwiOiJyZW5uYW5AdG9jYS5jb20iLCJob3N0IjoiaHR0cFx1MDAzQS8vMTkyLjE2OC4wLjE4OVx1MDAzQTg4Njcvcm9vdC8iLCJ0b2tlbiI6ImY4NTJ4UGRxYW80dzBBUjZDY3JRMmQ3ZTQ1Y0N3TUg2R0tPMTczbHAifQ==');
      qrJson = JSON.parse(rawJson);

      this.setState({
        index: 2
      });

      this.handleLoadingMessages();

      await this.handleLoginSync()
        .then(async loginSuccess => {
          if (loginSuccess) {
            const deviceId = DeviceInfo.getUniqueID();

            await firebase.firestore()
              .collection('users')
              .doc(this.credentials.user.uid)
              .set({
                deviceId: deviceId,
              }, { merge: true });

            setTimeout(() => {
              this.callAnimation();
            }, 2500);
          }
          else {
            this.setState({
              index: 0
            });
          }
        })
        .catch(error => {
          this.setState({
            index: 0
          });
        });
    }
    catch (error) {
      error.qrCodeData = e.data;
      await firestoreWrapper.saveErrorAsync('setup_error', error);

      alert('Código QR inválido. Tente novamente.');

      this.setState({
        index: 0
      });
    }
  }

  render() {
    return (
      <View style={defaultStyles.centerContentContainer}>
        {
          !this.state.showingAnimation &&
          <View>
            {
              this.state.index == 0 &&
              <View style={defaultStyles.centerContentContainer}>
                <Text style={[defaultStyles.textCenter, defaultStyles.textHeader]}>
                  Master mobile
            </Text>

                <Image
                  source={require('./../../assets/splash.png')}
                  resizeMode='contain'
                  style={{
                    maxHeight: Dimensions.get('window').height * 0.5,
                    maxWidth: Dimensions.get('window').width * 0.5,
                    padding: 0,
                  }}
                />

                <Text style={defaultStyles.textCenter}>
                  Na tela de cadastro de usuários mobile, selecione seu usário e aponte seu celular para o código QR.
                  {'\n'}
                  {'\n'}
                  {'\n'}
                </Text>

                <Icon
                  name="arrow-right"
                  style={
                    {transform:[
                      {rotateZ: '45deg'}
                    ]}
                  }
                  color={bgHeader}
                  size={75}
                  onPress={() => 
                   // this.onSuccess(null)
                    this.setState({ index: 1 })
                  }
                />
              </View>
            }

            {
              this.state.index == 1 &&
              <QRCodeScanner
                permissionDialogMessage='Por favor, habilite a permissão para o uso da câmera.'
                permissionDialogTitle='Permissão necessária'
                cameraStyle={cameraStyles.container}
                onRead={this.onSuccess.bind(this)}
                checkAndroid6Permissions={true}
                reactivateTimeout={5000}
                bottomContent={null}
                captureAudio={false}
                reactivate={true}
                topContent={null}
              />
            }

            {
              this.state.index == 2 &&
              <View style={defaultStyles.centerContentContainer}>
                <LoadingScreen />
                <Text style={defaultStyles.textCenter}>
                  {this.state.loadingMessage}
                </Text>
              </View>
            }
          </View>
        }
        {
          this.state.showingAnimation &&
          <View style={[defaultStyles.centerContentContainer, {
            position: 'absolute',
            bottom: 0
          }]}>
            <LottieView
              source={require('../../assets/animations/rocket.json')}
              style={animationStyles.animation}
              resizeMode="cover"
              autoPlay
            />
          </View>
        }
      </View>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
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
)(SetupScreen);