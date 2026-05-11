import React from 'react';
import { BiSearchAlt } from 'react-icons/bi';
import { MdOutlineInventory2 } from 'react-icons/md';
import { HiOutlineInbox } from 'react-icons/hi';
import './emptyState.scss';

const EMPTY_ICONS = {
  search: BiSearchAlt,
  inventory: MdOutlineInventory2,
  default: HiOutlineInbox
};

const EmptyState = ({ 
  image,
  icon = 'default',
  iconSize = 80,
  title = '沒有資料',
  description = '目前沒有相關資料',
  actionText = '返回上一頁',
  onAction = () => window.history.back()
}) => {
  const IconComponent = EMPTY_ICONS[icon] || EMPTY_ICONS.default;

  return (
    <div className="empty-state">
      {image ? (
        <img src={image} alt={title} />
      ) : (
        <div className="icon-wrapper">
          <IconComponent size={iconSize} />
        </div>
      )}
      <h2>{title}</h2>
      <p>{description}</p>
      {actionText && (
        <button onClick={onAction} className="action-button">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;