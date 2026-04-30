import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faStar, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useParams } from 'react-router-dom';
import { request } from '../utils/apiService';
import './travelPackageDetail.scss';

const TravelPackageDetail = () => {
  const { packageId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await request('GET', `/travel/packages/${packageId}`);
      if (res.success) setData(res.data);
      setLoading(false);
    };

    fetchData();
  }, [packageId]);

  if (loading) return <div className="tpd-loading">Loading...</div>;
  if (!data) return <div className="tpd-loading">No Data</div>;

  return (
    <div className="tpd">

      {/* HERO */}
      <section className="tpd__hero">
        <img
          className="tpd__heroImg"
          src="https://picsum.photos/1600/900"
          alt={data.name}
        />

        <div className="tpd__heroOverlay">
          <h1>{data.name}</h1>

          <div className="meta">
            <span>
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              {data.location?.formatted_address || data.address}
            </span>

            <span className="rating">
              <FontAwesomeIcon icon={faStar} />
              {data.rating} ({data.reviews_count})
            </span>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="tpd__layout">

        {/* MAIN */}
        <main className="tpd__main">
          {/* NAV */}
          <div className="tpd__nav">
            {['itinerary', 'detail', 'reviews'].map(tab => (
              <button
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'itinerary' && '行程'}
                {tab === 'detail' && '介紹'}
                {tab === 'reviews' && '評價'}
              </button>
            ))}
          </div>

          {/* CONTENT */}
          <div className="tpd__content">
            {activeTab === 'itinerary' && (
              <div className="tpd__timeline">
                {data.itinerary?.map((day, i) => (
                  <div key={i} className="tpd__day">
                    <div className="dot" />
                    <div className="body">
                      <h3>Day {day.day} · {day.title}</h3>
                      <p>{day.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'detail' && (
              <p className="tpd__text">{data.description}</p>
            )}

            {activeTab === 'reviews' && (
              <div className="tpd__reviews">
                {data.reviews?.map((r, i) => (
                  <div key={i} className="tpd__review">
                    <div className="name">{r.user}</div>
                    <div className="stars">
                      <FontAwesomeIcon icon={faStar} /> {r.rating}
                    </div>
                    <p>{r.content}</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>

        {/* SIDE FLOAT PANEL */}
        <aside className="tpd__side">
          <div className="tpd__price">
            <div className="amount">${data.price_breakdown?.base_price}</div>
            <div className="unit">/ 人</div>
          </div>

          <button className="tpd__btn" onClick={() => setShowBooking(true)}>
            立即預訂
          </button>

          <ul className="tpd__features">
            <li><FontAwesomeIcon icon={faCheck} /> 即時確認</li>
            <li><FontAwesomeIcon icon={faCheck} /> 免費取消</li>
            <li><FontAwesomeIcon icon={faCheck} /> 導遊服務</li>
          </ul>
        </aside>

      </section>

      {/* MODAL */}
      {showBooking && (
        <div className="tpd__modal">
          <div className="box">
            <h3>預訂 {data.name}</h3>
            <button onClick={() => setShowBooking(false)}>關閉</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TravelPackageDetail;