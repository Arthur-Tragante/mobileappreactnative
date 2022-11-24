import * as Type from '../actions';

const customersState = {
  selectedCustomer: null,
};

customers = (state = customersState, action) => {
  switch (action.type) {

    case Type.SET_SELECTED_CUSTOMER:
      return {
        ...state,
        selectedCustomer: action.selectedCustomer,
      };

    default:
      return state;

  }
};

export default customers;
