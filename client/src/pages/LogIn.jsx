import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logIn, setUserInfo } from "../redux/userStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleRight, faQuestion } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { request } from "../utils/apiService";
import CaptchaSlider from "../components/CaptchaSlider";
import "./logIn.scss";

const LogIn = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [captchaPassed, setCaptchaPassed] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogIn = async (e) => {
        e.preventDefault();

        if (!captchaPassed) {
            toast.error("請先完成滑塊驗證");
            return;
        }

        const result = await request(
            "POST",
            "/auth/login",
            {
                account: email,
                password,
            },
            setLoading
        );

        if (result.success) {
            const { userDetails } = result.data;
            toast.success("登入成功！");
            dispatch(setUserInfo(userDetails));
            dispatch(logIn());
            navigate("/");
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="logInWrapper">
            <div className="logInContainer">
                <div className="logInTitle">
                    <div className="left">
                        <span className="logo">MIKE.BOOKING</span>
                    </div>
                </div>
            </div>

            <div className="logInContainer">
                <h2>LogIn Account</h2>
                <form onSubmit={handleLogIn}>
                    <div className="formGroup">
                        <label htmlFor="email">E-mail:</label>
                        <input
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="password">password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="captchaSliderWrapper">
                        <CaptchaSlider
                            onPass={() => setCaptchaPassed(true)}
                            onFail={() => setCaptchaPassed(false)}
                        />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? "Loading..." : "LogIn"}
                    </button>
                </form>

                <div className="buttonGroup">
                    <button className="forgotBtn" onClick={() => navigate("/forgot")}>
                        forgot account <FontAwesomeIcon icon={faQuestion} />
                    </button>
                    <button className="signUpBtn" onClick={() => navigate("/signUp")}>
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogIn;
