import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { replace, navigateTo } from "../Redux/actions";
import AppConfig from '../constants/AppConfig';
import DrawerContent from "./DrawerContent";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import React from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from "react-native";

import {
  drawerInactiveItemColor,
  bgDrawerInactiveItem,
  bgDrawerActiveItem
} from "../global.styles";
import Colors from '../styles/Colors';

const Drawer = ({ replace, navigateTo, activeRoute, routes, closeDrawer }) => (
  <View style={styles.viewStyle}>
    <DrawerContent />
    <ScrollView>
      {
        routes.filter(route => route.sidemenu == true).map(route => (
          <TouchableOpacity
            key={route.screen + route.name}
            onPress={() => {
              closeDrawer();
              if (route.name != activeRoute.name) {
                if (activeRoute.name == 'Master mobile') {
                  navigateTo(route.name);
                }
                else {
                  replace(route.name);
                }
              }
            }}
            style={
              activeRoute.name === route.name
                ? [styles.drawerItem, styles.activeDrawerItem]
                : styles.drawerItem
            }
          >
            {route.icon && (
              <View style={styles.drawerItemLogo}>
                <Icon
                  color={activeRoute.name === route.name ? "#fff" : "#000"}
                  name={route.icon}
                  size={30}
                />
              </View>
            )}
            <Text
              style={
                activeRoute.name === route.name
                  ? { color: "#fff" }
                  : { color: "#000" }
              }
            >
              {route.name}
            </Text>
          </TouchableOpacity>
        ))
      }
    </ScrollView>

    <TouchableOpacity style={styles.drawerItemFooter} key='APP_VERSION'>
      <Text style={{ color: Colors.lightgray }}>
        -- v{AppConfig.APP_VERSION} --
      </Text>
    </TouchableOpacity>
  </View>
);

Drawer.propTypes = {
  activeRoute: PropTypes.shape({
    name: PropTypes.string.isRequired,
    screen: PropTypes.any.isRequired,
    icon: PropTypes.string
  }).isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  replace: PropTypes.func.isRequired,
  navigateTo: PropTypes.func.isRequired,
  closeDrawer: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
  activeDrawerItem: {
    backgroundColor: bgDrawerActiveItem
  },
  drawerItem: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: bgDrawerInactiveItem,
    color: drawerInactiveItemColor,
    height: 50,
    paddingLeft: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#fff"
  },
  drawerItemLogo: {
    paddingRight: 16
  },
  viewStyle: {
    flex: 1
  },
  drawerItemFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: bgDrawerInactiveItem,
    color: Colors.lightgray,
    height: 50,
    paddingRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#fff"
  },
});

const mapStateToProps = (state, ownProps) => ({
  routes: state.routes.routes,
  activeRoute: state.routes.activeRoute,
  closeDrawer: ownProps.closeDrawer,
});

const mapDispatchToProps = dispatch => ({
  replace: routeName => {
    dispatch(replace(routeName));
  },
  navigateTo: routeName => {
    dispatch(navigateTo(routeName));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Drawer);
