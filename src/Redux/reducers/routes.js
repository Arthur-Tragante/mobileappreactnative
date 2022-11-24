import { NavigationActions, StackActions } from 'react-navigation';
import * as Type from '../actions';
import routesMap from '../../Navigation/routes';

const routeState = {
  activeRoute: routesMap[0],
  routes: routesMap,
  navigator: null,
  activeRouteKey: routesMap[0].name,
  query: null,
  querySubmit: false,
  viewAction: null,
  viewActionPai: null,
  runningAnimation: null,
  hasUpdate: null,
  forceLogout: false,
  validateSession: true,
};

const routes = (state = routeState, action) => {
  switch (action.type) {
    case Type.NAVIGATE_TO:
      state.navigator.dispatch(NavigationActions.navigate({ routeName: action.routeName }));
      return state;

    case Type.REPLACE:
      state.navigator.dispatch(StackActions.replace({ routeName: action.routeName }));
      return state;

    case Type.SET_NAVIGATOR:
      return {
        ...state,
        navigator: action.navigator,
      };

    case Type.SET_ACTIVE_ROUTE:
      return {
        ...state,
        activeRoute: state.routes.find(route => route.name === action.activeRouteName),
      };

    case Type.POP_ACTIVE_ROUTE:
      state.navigator.dispatch(StackActions.pop({
        immediate: true,
        n: 1,
      }));

      return state;

    case Type.GO_BACK:
      state.navigator.dispatch(NavigationActions.back());
      return state;

    case Type.HANDLE_SEARCH:
      return {
        ...state,
        query: action.query,
        querySubmit: action.querySubmit,
      };

    case Type.SET_VIEW_ACTION:
      return {
        ...state,
        viewAction: action.viewAction,
      };

    case Type.SET_VIEW_ACTION_PAI:
      return {
        ...state,
        viewActionPai: action.viewActionPai,
      };

    case Type.SET_RUNNING_ANIMATION:
      return {
        ...state,
        runningAnimation: action.runningAnimation,
      };

    case Type.SET_HAS_UPDATE:
      return {
        ...state,
        hasUpdate: action.hasUpdate,
      };

    case Type.SET_FORCE_LOGOUT:
      return {
        ...state,
        forceLogout: action.forceLogout,
      };

    case Type.SET_VALIDATE_SESSION:
      return {
        ...state,
        validateSession: action.validateSession,
      };

    default:
      return state;
  }
};

export default routes;