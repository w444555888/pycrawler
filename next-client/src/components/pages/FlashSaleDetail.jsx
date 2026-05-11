import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHotel, faClock, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import DateRangePicker from '@/components/DateRangePicker";
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { request } from '@/utils/api/service';
import Skeleton from 'react-loading-skeleton';
import { toast } from 'react-toastify';
import dayjs from "dayjs";
import "./flashSaleDetail.scss";

const FlashSaleDetail = () => {
    const { userInfo } = useSelector(state => state.user);
    const userId = userInfo?.id ?? ''

    // saleId
    const { id } = useParams();

    const [sale, setSale] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(false);


    // 日期
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [date, setDate] = useState(null);


    const fetchData = async () => {
        const res = await request("GET", `/hotelFlashSale/${id}`, {}, setLoading);
        if (res.success) {
            setSale(res.data);
        } else {
            toast.error("讀取活動資料失敗");
        }
    };

    const handleBook = async () => {
        if (!date) {
            toast.warning("請先選擇入住日期");
            return;
        }
        setBooking(true);
        const res = await request("POST", "/hotelFlashSale/book", {
            saleId: sale.id,
            userId,
            date: dayjs(date).format("YYYY-MM-DD"),
            basePrice: sale.basePrice,
            discountRate: sale.discountRate,
        });

        if (res.success) {
            toast.success("搶購成功！");
            setSuccess(true);
        } else {
            toast.error(res.toast || "搶購失敗，請稍後再試");
        }
        setBooking(false);
    };




    useEffect(() => {
        fetchData();
    }, []);


    if (loading || !sale)
        return (
            <div className="fs-detail-loading skeleton-wrapper">
                <Skeleton height={200} />

                <div className="fs-detail-content">
                    <h2 className="title">
                        <Skeleton width={"60%"} height={30} />
                    </h2>

                    <p className="hotel">
                        <Skeleton width={"40%"} height={20} />
                    </p>
                    <p className="room">
                        <Skeleton width={"50%"} height={20} />
                    </p>
                    <p className="time">
                        <Skeleton width={"70%"} height={20} />
                    </p>

                    <div className="fs-price">
                        <Skeleton width={"50%"} height={28} />
                        <Skeleton width={"40%"} height={28} />
                    </div>

                    <div className="fs-date-picker">
                        <Skeleton height={40} />
                    </div>

                    <div className="desc">
                        <Skeleton count={3} />
                    </div>

                    <Skeleton height={45} borderRadius={10} />
                </div>
            </div>
        );

    const salePrice = Math.round(sale.basePrice * sale.discountRate);

    if (success) {
        return (
            <div className="fs-detail-page">
                <div className="fs-success-wrapper">

                    <div className="fs-success-card">
                        <div className="fs-success-icon">✔</div>

                        <h2 className="fs-success-title">訂購成功！</h2>

                        <p className="fs-success-subtitle">
                            您已成功搶購此限時優惠，以下為您的訂購資訊：
                        </p>

                        <div className="fs-success-summary">
                            <div className="summary-item">
                                <span className="label">飯店：</span>
                                <span className="value">{sale.hotelId?.name}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">房型：</span>
                                <span className="value">{sale.roomId?.title}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">入住日期：</span>
                                <span className="value">{dayjs(date).format("YYYY-MM-DD")}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">優惠價格：</span>
                                <span className="value">NT$ {salePrice.toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            className="fs-success-btn"
                            onClick={() => (window.location.href = '/personal')}
                        >
                            查看訂單
                        </button>
                    </div>

                </div>
            </div>
        );
    } else {
        return (
            <div className="fs-detail-page">
                <div className="fs-detail-wrapper">
                    <div className="fs-detail-banner-wrap">
                        <img
                            src={sale.bannerUrl}
                            className="fs-detail-banner"
                        />
                    </div>

                    <div className="fs-detail-content">
                        <h2 className="title">{sale.title}</h2>
                        <p className="hotel">
                            <FontAwesomeIcon icon={faHotel} className="fs-icon hotel-icon" />
                            {sale.hotelId?.name}
                        </p>
                        <p className="room">房型：{sale.roomId?.title}</p>
                        <p className="time">
                            <FontAwesomeIcon icon={faClock} className="fs-icon time-icon" />
                            活動時間：
                            {dayjs(sale.startTime).format("YYYY-MM-DD")} ~{" "}
                            {dayjs(sale.endTime).format("YYYY-MM-DD")}
                        </p>

                        <p className="discount">
                            現在只要 <b>{sale.discountRate * 10} 折</b> ！
                        </p>
                        <p className="price">
                            原價：
                            <span className="fs-origin">
                                NT$ {sale.basePrice?.toLocaleString()}
                            </span>
                            <br />
                            搶購價：
                            <b className="fs-sale">NT$ {salePrice.toLocaleString()}</b>
                        </p>

                        <div className="fs-date-picker">
                            <button
                                className="fs-date-btn"
                                onClick={() => setShowDatePicker(!showDatePicker)}
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} />{" "}
                                {startDate ? `已選日期：${startDate}` : "選擇入住日期"}
                            </button>

                            {showDatePicker && (
                                <div className="fs-date-popup">
                                    <DateRangePicker
                                        singleDay
                                        setStartDate={setStartDate}
                                        setEndDate={setEndDate}
                                        setDate={setDate}
                                        onClose={() => setShowDatePicker(false)}
                                    />
                                </div>
                            )}
                        </div>

                        {sale.description && (
                            <div className="desc">
                                <div className="desc-title">活動說明</div>
                                <p>{sale.description}</p>
                            </div>
                        )}

                        <button
                            className="fs-btn"
                            onClick={handleBook}
                            disabled={booking}
                        >
                            {booking ? "搶購中..." : "立即搶購"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};

export default FlashSaleDetail;
