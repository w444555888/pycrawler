"use client"

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { request } from '@/utils/api/service';
import { useRouter } from 'next/navigation';
import EmptyState from "../subcomponents/EmptyState";
import "./flashSaleList.scss";

const FlashSaleList = () => {
    const [list, setList] = useState([]);
    const [activeOnly, setActiveOnly] = useState(true);
    const navigate = useRouter();

    const fetchFlashSaleList = async (activeOnly = false) => {
        const url = activeOnly ? "/hotelFlashSale?activeOnly=true" : "/hotelFlashSale";
        const res = await request("GET", url);
        if (res.success) setList(res.data);
    };


    useEffect(() => {
        fetchFlashSaleList(activeOnly);
    }, [activeOnly]);

    return (
        <div className="flash-sale-page">
            <h2 className="fs-title">
                <FontAwesomeIcon icon={faFire} className="fs-icon fire" />
                飯店搶購專區
            </h2>

            <div className="fs-filter">
                <button
                    className={`fs-filter-btn ${!activeOnly ? "active" : ""}`}
                    onClick={() => setActiveOnly(false)}
                >
                    全部活動
                </button>
                <button
                    className={`fs-filter-btn ${activeOnly ? "active" : ""}`}
                    onClick={() => setActiveOnly(true)}
                >
                    進行中活動
                </button>
            </div>
            {list.length === 0 ? (
                <EmptyState
                    icon="inventory"
                    title="沒有活動"
                    description={activeOnly ? "目前沒有進行中的活動" : "目前沒有任何限時搶購活動"}
                    actionText="重新整理"
                    onAction={() => fetchFlashSaleList(activeOnly)}
                />
            ) : (
                <div className="fs-list">
                    {list.map((item) => (
                        <div
                            className="fs-card"
                            key={item.id}
                            onClick={() => navigate.push(`/flash-sale/${item.id}`)}
                        >
                            <div className="fs-img-wrap">
                                <img src={ item.bannerUrl} className="fs-img" />
                            </div>

                            <div className="fs-info">
                                <h3 className="fs-name">{item.title}</h3>

                                <p className="fs-hotel">{item.hotelId?.name}</p>
                                <p className="fs-room">房型：{item.roomId?.title}</p>

                                <p className="fs-date">
                                    {item.startTime.substring(0, 10)} ~ {item.endTime.substring(0, 10)}
                                </p>
                                <p className="fs-price">
                                    原價：<span className="fs-origin">NT$ {item.basePrice?.toLocaleString()}</span><br />
                                    搶購價：<b className="fs-sale">NT$ {(item.basePrice * item.discountRate).toLocaleString()}</b>
                                </p>
                                <p className="fs-discount">
                                    限時折扣：<b>{item.discountRate * 10}折</b>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FlashSaleList;
