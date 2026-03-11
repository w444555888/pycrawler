import React, { useEffect, useState } from 'react';
import Div100vh from "react-div-100vh";
import "./app.scss";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { routeConfig } from "./routes/routes";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { logIn, logOut } from "./redux/userStore";
import { request } from "../src/utils/apiService";
import { socket } from "./utils/socket";
import { toast } from 'react-toastify';

function App() {
  const dispatch = useDispatch();
  const { login } = useSelector((state) => state.user);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const verifyLogin = async () => {
      const result = await request("GET", "/auth/me");
      if (result.success && result.data) {
        dispatch(logIn());
      } else {
        dispatch(logOut());
      }
      setChecked(true);
    };
    verifyLogin();
  }, [dispatch]);

  if (!checked) return null;

  return (
    <Div100vh className="App">
      <Router>
        <Routes>
          {routeConfig.map(({ path, element: Element, requireAuth }) => (
            <Route
              key={path}
              path={path}
              element={
                requireAuth ? (
                  <ProtectedRoute login={login} element={<Element />} />
                ) : (
                  <Element />
                )
              }
            />
          ))}
        </Routes>
      </Router>
    </Div100vh>
  );
}

export default App;
