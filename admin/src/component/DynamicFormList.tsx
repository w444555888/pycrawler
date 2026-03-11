import React from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Checkbox
} from 'antd';
import './dynamicFormList.scss';

export type ListFieldType = 'input' | 'number' | 'select' | 'checkbox';

export interface ListFieldConfig {
  name: string;
  label: string;
  type: ListFieldType;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
}

interface DynamicFormListProps {
  name: string;
  label?: string;
  fields: ListFieldConfig[];
  addButtonText?: string;
}

const DynamicFormList: React.FC<DynamicFormListProps> = ({
  name,
  label,
  fields,
  addButtonText = '新增'
}) => {
  return (
    <Form.List name={name}>
      {(fieldItems, { add, remove }) => (
        <div>
          {fieldItems.map(({ key, name: itemName, ...restField }) => (
            <Space key={key} align="baseline" className="form-item-row" wrap>
              {fields.map((field) =>
                field.type === 'checkbox' ? (
                  <Form.Item
                    {...restField}
                    name={[itemName, field.name]}
                    key={field.name}
                    valuePropName="checked" 
                  >
                    <Checkbox>{field.label}</Checkbox>
                  </Form.Item>
                ) : (
                  <Form.Item
                    {...restField}
                    name={[itemName, field.name]}
                    label={field.label}
                    rules={
                      field.required
                        ? [{ required: true, message: `請輸入 ${field.label}` }]
                        : []
                    }
                    key={field.name}
                  >
                    {field.type === 'input' && (
                      <Input placeholder={field.placeholder} />
                    )}
                    {field.type === 'number' && (
                      <InputNumber
                        placeholder={field.placeholder}
                        className="input-number"
                      />
                    )}
                    {field.type === 'select' && (
                      <Select
                        placeholder={field.placeholder}
                        className="select-field"
                      >
                        {field.options?.map((opt) => (
                          <Select.Option key={opt.value} value={opt.value}>
                            {opt.label}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>
                )
              )}

              <Button danger onClick={() => remove(itemName)}>
                刪除
              </Button>
            </Space>
          ))}
          <Form.Item>
            <Button type="dashed" onClick={() => add()} block>
              {addButtonText}
            </Button>
          </Form.Item>
        </div>
      )}
    </Form.List>
  );
};

export default DynamicFormList;
