import Dashboard from "../Views/Dashboard";
import Customers from "../Views/Customers";
import Products from "../Views/Products";
import Orders from "../Views/Orders";

import Settings from "../Views/Settings";

import ProductDetails from "../Views/Details/ProductDetails";
import OrderDetails from "../Views/Details/OrderDetails";
import CustomerDetails from "../Views/Details/CustomerDetails";

import Logout from "../Views/Logout";
import Splash from "../Views/Splash";
import Setup from "../Views/Setup";

export default [
  { name: 'Splash', screen: Splash, icon: null, sidemenu: false, header: false, searchVisible: false },
  { name: 'Setup', screen: Setup, icon: null, sidemenu: false, header: false, searchVisible: false },

  { name: 'Master mobile', screen: Dashboard, icon: 'view-dashboard', sidemenu: true, header: true, searchVisible: false },

  { name: 'Produtos', screen: Products, icon: 'store', sidemenu: true, header: true, searchVisible: true },
  { name: 'Vendas', screen: Orders, icon: 'cart', sidemenu: true, header: true, searchVisible: true },
  { name: 'Clientes', screen: Customers, icon: 'account-circle', sidemenu: true, header: true, searchVisible: true },

  { name: 'Configurações', screen: Settings, icon: 'settings', sidemenu: true, header: true, searchVisible: false },

  { name: 'Produto', screen: ProductDetails, icon: null, sidemenu: false, header: true, searchVisible: false },
  { name: 'Venda', screen: OrderDetails, icon: null, sidemenu: false, header: true, searchVisible: false },
  { name: 'Cliente', screen: CustomerDetails, icon: null, sidemenu: false, header: true, searchVisible: false },

  { name: 'Logout', screen: Logout, icon: 'logout', sidemenu: true, header: false, searchVisible: false },
];