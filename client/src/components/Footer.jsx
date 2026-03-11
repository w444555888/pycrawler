/*
 * @Author: w444555888 w444555888@yahoo.com.tw
 * @Date: 2024-07-17 20:28:18
 * @LastEditors: w444555888 w444555888@yahoo.com.tw
 * @LastEditTime: 2024-07-18 00:08:45
 * @FilePath: \my-app\src\components\Footer.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState } from "react";
import { request } from "../utils/apiService"
import { toast } from "react-toastify";
import "./footer.scss";

const Footer = () => {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);
    const [agreeAppLink, setAgreeAppLink] = useState(false);
    const handleSubscribe = async () => {
        if (!email.trim()) {
            toast.error("請輸入您的電子郵件");
            return;
        }

        if (!agreeAppLink) {
            toast.info("請勾選同意接收 App 下載連結");
            return;
        }

        const res = await request("POST", "/subscribe", { email });
        if (res.success) {
            const msg = res.data?.message;
            if (msg.includes("訂閱成功")) {
                setSubscribed(true);
            }
            
            toast.success(msg);
            setEmail("");
        } else {
            toast.error(res.message);
        }
    };

    return (
        <div className="footer">
            <div className="title">
                訂閱 MIKE.BOOKING
                <span>立即訂閱，我們將寄送最佳訂房優惠給您。</span>
            </div>

            <div className="email-container">
                {subscribed ? (
                    <div className="sub-success">您已成功訂閱，感謝！</div>
                ) : (
                    <div className="wrapper">
                        <input
                            className="email"
                            type="email"
                            placeholder="您的電子郵件"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button className="sub" onClick={handleSubscribe}>
                            訂閱！
                        </button>
                    </div>
                )}

                <div className="checktext">
                    <input
                        type="checkbox"
                        id="checkbox"
                        checked={agreeAppLink}
                        onChange={(e) => setAgreeAppLink(e.target.checked)}
                    />
                    請發送 Booking.com 免費 App 下載連結給我！
                </div>
            </div>

            <div className="sub-container">
                Copyright © 2025 Trip.com Travel Singapore Pte. Ltd. All rights reserved
                <br />
                Site Operator: Trip.com Travel Singapore Pte. Ltd.
            </div>
        </div>
    );
};

export default Footer;
