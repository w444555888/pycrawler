import React from 'react';
import { Form, Select, InputNumber, Button, Space } from 'antd';
import './pricingFormList.scss';


const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

const PricingFormList = ({ form }: { form: any }) => {
  const [_, forceUpdate] = React.useState({});

  return (
    <Form.List name="pricing">
      {(fields, { add, remove }) => {
        const selectedDaysMap = fields.reduce((map, field) => {
          const val = form.getFieldValue(['pricing', field.name]);
          if (val?.days_of_week) {
            val.days_of_week.forEach((d: number) => {
              map[d] = (map[d] || 0) + 1;
            });
          }
          return map;
        }, {} as Record<number, number>);

        return (
          <>
            {fields.map(({ key, name, ...restField }) => {
              const currentDays = form.getFieldValue(['pricing', name])?.days_of_week || [];
              const getDisabled = (day: number) =>
                selectedDaysMap[day] && !currentDays.includes(day);

              return (
                <div key={key} className="pricing-item-row">
                  <Form.Item {...restField} name={[name, 'days_of_week']} rules={[{ required: true }]}>
                    <Select
                      mode="multiple"
                      placeholder="選擇星期"
                      className="weekday-select"
                      onChange={() => forceUpdate({})}
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map(day => (
                        <Select.Option key={day} value={day} disabled={getDisabled(day)}>
                          {weekdays[day]}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true }]}>
                    <InputNumber placeholder="價格" />
                  </Form.Item>
                  <Button danger onClick={() => remove(name)}>刪除</Button>
                </div>
              );
            })}
            <Form.Item><Button type="dashed" onClick={() => add({ days_of_week: [] })}>新增價格</Button></Form.Item>
          </>
        );
      }}
    </Form.List>
  );
};

export default PricingFormList;
