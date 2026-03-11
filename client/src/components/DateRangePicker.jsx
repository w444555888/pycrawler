import React from 'react';
import { DateRange, Calendar } from 'react-date-range';
import { format } from 'date-fns';
import './dateRangePicker.scss';

const DateRangePicker = ({
  dates,
  setDates,
  setStartDate,
  setEndDate,
  setDate,
  onClose,
  singleDay = false
}) => {

  // 單日模式
  const handleSingleDaySelect = (day) => {
    const formatted = format(day, 'yyyy-MM-dd');
    setStartDate(formatted);
    setEndDate(formatted);
    setDate(formatted);
    onClose?.();
  };


  //區間模式
  const handleDateRangeChange = (item) => {
    setDates([item.selection]);
    const start = format(item.selection.startDate, 'yyyy-MM-dd');
    const end = format(item.selection.endDate, 'yyyy-MM-dd');
    setStartDate(start);
    setEndDate(end);
    if (start !== end) onClose?.();
  };

  return (
    <div className="date">
      {singleDay ? (
        <Calendar
          date={dates?.[0]?.startDate || new Date()}
          onChange={handleSingleDaySelect}
          minDate={new Date()}
          color="#3b82f6"
        />
      ) : (
        <DateRange
          editableDateInputs={true}
          onChange={handleDateRangeChange}
          moveRangeOnFirstSelection={false}
          ranges={dates}
          minDate={new Date()}
        />
      )}
    </div>
  );
};

export default DateRangePicker;