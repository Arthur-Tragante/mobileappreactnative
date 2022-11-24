export const NAVIGATE_TO = 'NAVIGATE_TO';
export const REPLACE = 'REPLACE';
export const GO_BACK = 'GO_BACK';
export const SET_NAVIGATOR = 'SET_NAVIGATOR';
export const SET_ACTIVE_ROUTE = 'SET_ACTIVE_ROUTE';
export const POP_ACTIVE_ROUTE = 'POP_ACTIVE_ROUTE';

export const SET_RUNNING_ANIMATION = 'SET_RUNNING_ANIMATION';
export const HANDLE_SEARCH = 'HANDLE_SEARCH';

export const SET_SELECTED_CUSTOMER = 'SET_SELECTED_CUSTOMER';
export const SET_SELECTED_PRODUCT = 'SET_SELECTED_PRODUCT';
export const SET_SELECTED_ORDER = 'SET_SELECTED_ORDER';
export const SET_VIEW_ACTION = 'SET_VIEW_ACTION';
export const SET_VIEW_ACTION_PAI = 'SET_VIEW_ACTION_PAI';
export const SET_HAS_UPDATE = 'SET_HAS_UPDATE';
export const SET_FORCE_LOGOUT = 'SET_FORCE_LOGOUT';
export const SET_VALIDATE_SESSION = 'SET_VALIDATE_SESSION';

export const PUT_CUSTOMER = 'PUT_CUSTOMER';
export const PUT_ORDER = 'PUT_ORDER';

export const navigateTo = routeName => ({
  type: NAVIGATE_TO,
  routeName,
});

export const replace = routeName => ({
  type: REPLACE,
  routeName,
});

export const goBack = () => ({
  type: GO_BACK,
});

export const setNavigator = navigator => ({
  type: SET_NAVIGATOR,
  navigator,
});

export const setActiveRoute = activeRouteName => ({
  type: SET_ACTIVE_ROUTE,
  activeRouteName,
});

export const popActiveRoute = () => ({
  type: POP_ACTIVE_ROUTE,
});

export const handleSearch = (query, querySubmit) => ({
  type: HANDLE_SEARCH,
  query,
  querySubmit,
});

export const setCustomer = (selectedCustomer) => ({
  type: SET_SELECTED_CUSTOMER,
  selectedCustomer,
});

export const setOrder = (selectedOrder) => ({
  type: SET_SELECTED_ORDER,
  selectedOrder,
});

export const setProduct = (selectedProduct) => ({    
  type: SET_SELECTED_PRODUCT,
  selectedProduct,
});

export const setViewAction = (viewAction) => ({
  type: SET_VIEW_ACTION,
  viewAction,
})

export const setViewActionPai = (viewAction) => ({
  type: SET_VIEW_ACTION_PAI,
  viewActionPai: viewAction,
})

export const setRunningAnimation = runningAnimation => ({
  type: SET_RUNNING_ANIMATION,
  runningAnimation,
})

export const setHasUpdate = hasUpdate => ({
  type: SET_HAS_UPDATE,
  hasUpdate,
});

export const setForceLogout = forceLogout => ({
  type: SET_FORCE_LOGOUT,
  forceLogout,
});

export const setValidateSession = validateSession => ({
  type: SET_VALIDATE_SESSION,
  validateSession,
});

export async function putCustomer(Customer) {
  return {
    type: PUT_CUSTOMER,
    payload: await putCustomerAsync(Customer)
  };
}

export async function putOrder(Order) {
  return {
    type: PUT_ORDER,
    payload: await putOrderAsync(Order)
  };
}
