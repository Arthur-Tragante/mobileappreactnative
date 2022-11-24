import * as Actions from "../Redux/actions";
import { StackActions, NavigationActions } from 'react-navigation';
import backgroundServices from "../services/BackgroundServices";
import localStorage from '../services/LocalStorage';
import { Alert, View, Text } from 'react-native';
import firebase from 'react-native-firebase';
import { connect } from "react-redux";
import LoadingScreen from './Loading';
import defaultStyles from '../styles';
import React from "react";
import { bindActionCreators } from 'redux';

class LogoutScreen extends React.Component {
  async componentDidMount() {
    if (!this.props.forceLogout) {
      Alert.alert(
        'Deseja realmente sair?',
        'Seus dados não serão perdidos, porém você precisará ler o código QR novamente para utilizar o aplicativo neste telefone.',
        [
          {
            text: 'Não',
            onPress: () => {
              this.props.navigation.goBack();
            },
          },
          {
            text: 'Sim',
            onPress: async () => {
              await this.handleLogoutAsync();
            },
          },
        ],
        {
          cancelable: false
        },
      )
    }
    else {
      this.props.setForceLogout(false);
      await this.handleLogoutAsync();
    }
  }

  async handleLogoutAsync() {
    await backgroundServices.stopAllServicesAsync();
    await localStorage.clearStorageAsync();

    await firebase.auth().signOut()
      .then(() => {
      })
      .catch(() => {
      });

    setTimeout(() => {
      const resetAction = StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({ routeName: 'Splash' })],
      });
      this.props.navigation.dispatch(resetAction);
    }, 2000);
  }

  render() {
    return (
      <View style={defaultStyles.centerContentContainer}>
        <LoadingScreen />
        <Text style={defaultStyles.textCenter}>
          Saindo...
        </Text>
      </View>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  activeRoute: state.routes.activeRoute,
  routes: state.routes.routes,
  showMenu: ownProps.showMenu,
  goBack: ownProps.goBack,
  forceLogout: state.routes.forceLogout,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(Actions, dispatch);
;

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LogoutScreen);