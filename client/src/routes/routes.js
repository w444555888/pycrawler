import Home from "../pages/Home"
import HotelsList from "../pages/HotelsList"
import Hotel from "../pages/Hotel"
import SignUp from "../pages/SignUp"
import LogIn from "../pages/LogIn"
import Forgot from "../pages/Forgot"
import Personal from "../pages/Personal"
import Flight from "../pages/Flight"
import ResetPassword from "../pages/ResetPassword"
import Order from "../pages/Order"
import BookingFlight from "../pages/BookingFlight"
import FlashSaleList from "../pages/FlashSaleList"
import FlashSaleDetail from "../pages/FlashSaleDetail"
import TravelPackageList from "../pages/TravelPackageList"


export const ROUTES = {
  HOME: '/',
  SIGNUP: '/signUp',
  LOGIN: '/logIn',
  FORGOT: '/forgot',
  RESET_PASSWORD: '/reset-password/:token',
  HOTELS_LIST: '/hotelsList',
  HOTELS: '/hotels',
  PERSONAL: '/personal',
  ORDER: '/order',
  FLIGHT: '/flight',
  BOOKINGFLIGHT: '/bookingFlight',
  HOTELFLASHSALE: '/flash-sale',
  HOTELFLASHSALEDetail: '/flash-sale/:id',
  TRAVEL_PACKAGES: '/travel-packages'
}


export const routeConfig = [
  {
    path: ROUTES.HOME,
    element: Home,
    requireAuth: true
  },
  {
    path: ROUTES.SIGNUP,
    element: SignUp,
    requireAuth: false
  },
  {
    path: ROUTES.LOGIN,
    element: LogIn,
    requireAuth: false
  },
  {
    path: ROUTES.FORGOT,
    element: Forgot,
    requireAuth: false
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: ResetPassword,
    requireAuth: false
  },
  {
    path: ROUTES.HOTELS_LIST,
    element: HotelsList,
    requireAuth: true
  },
  {
    path: ROUTES.HOTELS,
    element: Hotel,
    requireAuth: true
  },
  {
    path: ROUTES.PERSONAL,
    element: Personal,
    requireAuth: true
  },
  {
    path: ROUTES.ORDER,
    element: Order,
    requireAuth: true
  },
  {
    path: ROUTES.FLIGHT,
    element: Flight,
    requireAuth: true
  },
  {
    path: '/bookingFlight',
    element: BookingFlight,
    requireAuth: true
  },
  {
    path: ROUTES.HOTELFLASHSALE,
    element: FlashSaleList,
    requireAuth: false
  },
  {
    path: ROUTES.HOTELFLASHSALEDetail,
    element: FlashSaleDetail,
    requireAuth: false
  },
  {
    path: ROUTES.TRAVEL_PACKAGES,
    element: TravelPackageList,
    requireAuth: false
  }
]