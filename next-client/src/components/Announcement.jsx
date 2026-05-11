
'use client'

import React, { useState } from "react";
import { faInfoCircle, faBolt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from 'next/navigation';
import { format } from "date-fns";
import "./announcement.scss";
const Announcement = ({ type }) => {
  const navigate = useRouter();

  const handleClickPopular = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formattedToday = format(today, "yyyy-MM-dd");
    const formattedTomorrow = format(tomorrow, "yyyy-MM-dd");

    navigate.push(
      `/hotelsList?popular=true&startDate=${formattedToday}&endDate=${formattedTomorrow}`
    );
  };

  const handleFlashSale = () => {
    navigate.push("/flash-sale");
  };

  return (
    <div className="announcement">
      <div className="container">
        {type === "Upper half" ? (
          // true
          <>
            <div className="infoDes">
              <FontAwesomeIcon icon={faInfoCircle} />
              出發前請務必查看最新的外交部旅遊警示，掌握目的地的即時安全資訊，安心出遊！
            </div>
            <div className="discountInfo">
              <div className="left">
                <img
                  src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/563834829.jpg?k=9abbe9b215903d92d58a8be200b95052f28ac8e30c12f7194f001179c8330d9c&amp;o="
                  alt=""
                />
              </div>
              <div className="right">
                <span>春季精選住宿</span>
                <span>立即預訂東京、大阪、首爾熱門飯店，享最多 30% 折扣</span>
                <div className="btn-group">
                  <button className="btn-normal" onClick={handleClickPopular}>查看熱門地點</button>
                  <button className="flash-sale-btn" onClick={handleFlashSale}>
                    <FontAwesomeIcon icon={faBolt} />
                    限時搶購・立即查看
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // false
          <div className="globalBanner">
            <img
              src="https://cf.bstatic.com/static/img/contact/cs/cs-globe/981cf108eeecda859688c0e51d4ea87595d70912.png"
              alt=""
            />
            <div className="bannerInfoDes">
              <h2>加入會員，解鎖專屬優惠</h2>
              <span>
                成為會員即可享有專屬折扣、累積點數、快速查詢訂單等貼心服務
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcement;
