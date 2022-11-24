import androidNotificationChannelsServices from "./services/AndroidNotificationChannelsServices";
import screensWithoutDrawer from "./Navigation/screensWithoutDrawer";
import { bgStatusBar, bgDrawer } from "./global.styles";
import AppNavigation from './Navigation/AppNavigation';
import * as reactNative from 'react-native';
import * as actions from "./Redux/actions";
import Toolbar from './Navigation/Toolbar';
import Drawer from './Navigation/Drawer';
import React, { Component } from 'react';
import reducer from './Redux/reducers';
import { Provider } from 'react-redux';
import { createStore } from "redux";
import { Container, Root } from "native-base";
import firebase from "react-native-firebase";
import DeviceInfo from 'react-native-device-info';
import toastWrapper from "./services/ToastWrapper";
import { StackActions } from "react-navigation";
import firestoreWrapper from "./services/FirestoreWrapper";
import backgroundServices from "./services/BackgroundServices";
import localStorage from "./services/LocalStorage";
import NetInfo from '@react-native-community/netinfo';

const getDrawerWidth = () => reactNative.Dimensions.get('window').width - (reactNative.Platform.OS === 'android' ? 56 : 64);
let store = createStore(reducer);

export default class App extends Component {
  constructor() {
    super();

    this.unsubscribeFromFirestoreUserSnapshot = null;
    this.unsubscribeFromNetInfoEventListener = null;

    this.navigator = React.createRef();
    this.drawer = React.createRef();

    this.state = {
      isDrawerLocked: true,
    }
  }

  async componentWillUnmount() {
    if (this.unsubscribeFromFirestoreUserSnapshot !== null) {
      this.unsubscribeFromFirestoreUserSnapshot();

      this.unsubscribeFromFirestoreUserSnapshot = null;
    }

    if (this.unsubscribeFromNetInfoEventListener !== null) {
      this.unsubscribeFromNetInfoEventListener();

      this.unsubscribeFromNetInfoEventListener = null;
    }
  }

  async componentDidMount() {
    store.dispatch(actions.setNavigator(this.navigator.current));

    androidNotificationChannelsServices.configureAppNotificationChannels();

    this.unsubscribeFromNetInfoEventListener = await NetInfo.addEventListener(this.handleNetworkChange);

    await this.handleFirebaseLoginChange();

    if (firestoreWrapper.isLoggedIn()) {
      const customerSyncFailed = parseInt(await localStorage.getValueAsync('app.customerSyncFailed'));
      const productSyncFailed = parseInt(await localStorage.getValueAsync('app.productSyncFailed'));

      if (productSyncFailed) {
        await backgroundServices.handleProductsSyncFromMasterApiAsync();
      }

      if (customerSyncFailed) {
        await backgroundServices.handleCustomersSyncFromMasterApiAsync();
      }
    }
  }

  async handleNetworkChange(state) {
    if (state.isConnected) {
      await firebase.firestore().enableNetwork();
    }
    else {
      await firebase.firestore().disableNetwork();
    }
  }

  async handleFirebaseLoginChange() {
    await firebase
      .auth()
      .onAuthStateChanged(async user => {
        this.configureFirestoreUserSnapshotChange();
      })
  }

  async configureFirestoreUserSnapshotChange() {
    await this.cancelFirestoreUserSnapshotChange();


    if (firestoreWrapper.isLoggedIn()) {
      this.unsubscribeFromFirestoreUserSnapshot = await firebase.firestore()
        .collection('users')
        .doc(firebase.auth().currentUser.uid)
        .onSnapshot(snapshot => {
          if (!store.getState().routes.validateSession) {
            return;
          }

          const userData = snapshot.data();

          const firestoreDeviceId = userData && userData.deviceId;
          const deviceId = DeviceInfo.getUniqueID();

          if (firestoreDeviceId !== deviceId) {
            this.cancelFirestoreUserSnapshotChange();

            toastWrapper.showToast('Sessão encerrada pois ocorreu um login em outro dispositivo.');

            store.dispatch(actions.setForceLogout(true));

            this.navigator.current.dispatch(
              StackActions.replace({
                routeName: 'Logout'
              })
            );
          }
        })
    }
  }

  cancelFirestoreUserSnapshotChange() {
    if (this.unsubscribeFromFirestoreUserSnapshot !== null) {
      this.unsubscribeFromFirestoreUserSnapshot();

      this.unsubscribeFromFirestoreUserSnapshot = null;
    }
  }

  openDrawer = () => {
    this.drawer.current.openDrawer();
  };

  closeDrawer = () => {
    this.drawer.current.closeDrawer();
  };

  getActiveRouteName = navigationState => {
    if (!navigationState) {
      return null;
    }

    const route = navigationState.routes[navigationState.index];
    if (route.routes) {
      return getActiveRouteName(route);
    }

    return route.routeName;
  };

  render() {
    return (
      <Root>
        <Container>
          <Provider store={store}>
            <reactNative.DrawerLayoutAndroid
              drawerLockMode={this.state.isDrawerLocked ? 'locked-closed' : 'unlocked'}
              renderNavigationView={() => <Drawer closeDrawer={this.closeDrawer} />}
              drawerPosition={reactNative.DrawerLayoutAndroid.positions.Left}
              drawerWidth={getDrawerWidth() - 80}
              drawerBackgroundColor={bgDrawer}
              ref={this.drawer}
            >
              <reactNative.View style={styles.container}>
                <reactNative.StatusBar
                  backgroundColor={bgStatusBar}
                  translucent
                  animated
                  hidden={false}
                />
                <Toolbar showMenu={this.openDrawer} />
                <AppNavigation
                  onNavigationStateChange={(_prevState, currentState) => {
                    const currentScreen = this.getActiveRouteName(currentState);

                    this.setState({
                      isDrawerLocked: screensWithoutDrawer.indexOf(currentScreen) > -1,
                    });

                    store.dispatch(actions.setActiveRoute(currentScreen));
                  }}
                  ref={this.navigator}
                />
              </reactNative.View>
            </reactNative.DrawerLayoutAndroid>
          </Provider>
        </Container>
      </Root>
    );
  }
}

const styles = reactNative.StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
});