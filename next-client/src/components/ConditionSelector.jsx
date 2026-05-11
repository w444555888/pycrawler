import React from 'react';
import './conditionSelector.scss';

const ConditionSelector = ({ conditions, setConditions }) => {
  const handleCounter = (name, type) => {
    setConditions(prev => ({
      ...prev,
      [name]: type === 'increase' ? prev[name] + 1 : prev[name] - 1
    }));
  };

  return (
    <div className="conditionsContainer">
      <div className="condition">
        成人
        <div className="conditionCounter">
          <button
            className="conditionCounterButton"
            disabled={conditions.adult <= 1}
            onClick={() => handleCounter('adult', 'decrease')}
          >-</button>
          <span className="number">{conditions.adult}</span>
          <button
            className="conditionCounterButton"
            onClick={() => handleCounter('adult', 'increase')}
          >+</button>
        </div>
      </div>
      <div className="condition">
        房間
        <div className="conditionCounter">
          <button
            className="conditionCounterButton"
            disabled={conditions.room <= 1}
            onClick={() => handleCounter('room', 'decrease')}
          >-</button>
          <span className="number">{conditions.room}</span>
          <button
            className="conditionCounterButton"
            onClick={() => handleCounter('room', 'increase')}
          >+</button>
        </div>
      </div>
    </div>
  );
};

export default ConditionSelector;
