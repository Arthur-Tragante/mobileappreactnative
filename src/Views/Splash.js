import { View } from 'react-native';
import LoadingScreen from './Loading';
import { connect } from "react-redux";
import defaultStyles from "../styles";
import React from 'react';
import * as Actions from "../Redux/actions";
import { bindActionCreators } from "redux";
import firestoreWrapper from '../services/FirestoreWrapper';

class SplashScreen extends React.Component {
  async componentDidMount() {
    await setTimeout(async () => {
      if (firestoreWrapper.isLoggedIn()) {
        this.props.navigation.replace('Master mobile');
      }
      else {
        this.props.navigation.replace('Setup');
      }

    }, 1000);
  }

  render() {
    return (
      <View style={defaultStyles.centerContentContainer}>
        <LoadingScreen />
      </View>
    )
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
)(SplashScreen);