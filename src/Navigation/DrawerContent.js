import { bgDrawerHeader, drawerHeaderColor } from '../global.styles';
import localStorage from '../services/LocalStorage';
import * as Actions from "../Redux/actions";
import { connect } from 'react-redux';
import { View } from 'native-base';
import React from 'react';

import {
  StyleSheet,
  Text,
  Image
} from "react-native";
import { bindActionCreators } from 'redux';

class DrawerContent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userEmail: '',
      userName: '',
    };
  }

  async getUserInfo() {
    let userEmail = await localStorage.getValueAsync('user.email');
    let userName = await localStorage.getValueAsync('user.name');

    this.setState({
      userEmail: userEmail,
      userName: userName,
    });
  }

  async componentDidMount() {
    await this.getUserInfo();
  }

  async componentDidUpdate() {
    if (this.props.hasUpdate) {
      await this.getUserInfo();
      this.props.setHasUpdate(false);
    }
  }

  render() {
    return (
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <Image
            source={require('./../../assets/splash.png')}
            resizeMode='center'
            style={{
              maxHeight: 50,
              maxWidth: 50,
              padding: 0,
            }}
          />
        </View>

        <View style={styles.subTitle}>
          <Text style={styles.drawerTitle}>{this.state.userName || 'Master mobile'}</Text>
          <Text style={styles.drawerEmail}>{this.state.userEmail}</Text>
        </View>
      </View>
    );
  }
};


const styles = StyleSheet.create({
  header: {
    paddingTop: 40, // 24dp (Space for the translucent StatusBar) plus 16dp Android Header paddingTop
    backgroundColor: bgDrawerHeader,
    flexDirection: "column",
    paddingLeft: 16,
    height: 170,
  },
  headerLogo: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#fff"
  },
  subTitle: {
    height: 56,
    paddingTop: 8
  },
  drawerTitle: {
    color: drawerHeaderColor,
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: 14
  },
  drawerEmail: {
    color: drawerHeaderColor,
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: 14
  },
});

const mapStateToProps = (state, ownProps) => ({
  activeRoute: state.routes.activeRoute,
  routes: state.routes.routes,
  showMenu: ownProps.showMenu,
  goBack: ownProps.goBack,
  hasUpdate: state.routes.hasUpdate,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(Actions, dispatch);
;

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DrawerContent);