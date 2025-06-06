import { register } from '@/services/apis/authController';
import { LockOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { message, Alert, Card, Select, Button, Form, Input } from 'antd';
import React, { useState } from 'react';
import { history } from '@umijs/max';
import useCategoryShareds from '@/selectors/useCategoryShareds';

interface RegisterFormData extends API.UsersDTO {
  confirmPassword?: string;
}

const Register: React.FC = () => {
  const [form] = Form.useForm();

  const { dmGender } = useCategoryShareds();

  const [registerState, setRegisterState] = useState<{
    status?: 'error';
    message?: string;
  }>({});

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values: RegisterFormData = await form.validateFields();
      
      if (values.password !== values.confirmPassword) {
        setRegisterState({
          status: 'error',
          message: 'Mật khẩu xác nhận không khớp!',
        });
        return;
      }

      setLoading(true);
      setRegisterState({}); // Clear previous error

      register({ ...values })
        .then((response) => {
          if (response?.success) {
            message.success('Đăng ký thành công!');
            history.push('/auth/login');
          } else {
            const errorMessage = response?.message || 'Đăng ký thất bại, vui lòng thử lại!';
            message.error(errorMessage);
            
            setRegisterState({
              status: 'error',
              message: errorMessage,
            });
          }
        })
        .catch((error) => {
          console.error('Register error:', error);
          
          // Xử lý error từ axios interceptor hoặc response handler
          let errorMessage = 'Đăng ký thất bại, vui lòng thử lại!';
          
          if (error.message) {
            errorMessage = error.message;
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          message.error(errorMessage);
          
          setRegisterState({
            status: 'error',
            message: errorMessage,
          });
        })
        .finally(() => {
          setLoading(false);
        });
        
    } catch (validationError) {
      console.error('Form validation error:', validationError);
      setLoading(false);
    }
  };


  return (
    <PageContainer title="Crane" style={{ alignItems: 'center' }}>
      <Card
        title={<div style={{ textAlign: 'center' }}>Đăng ký tài khoản</div>}
        style={{ maxWidth: '500px', margin: 'auto' }}
      >
        <Form form={form} layout="vertical">
          {registerState.status === 'error' && (
            <Alert
              message={registerState.message}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* UsersDTO */}
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 4, message: 'Mật khẩu phải có ít nhất 4 ký tự!' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Xác nhận mật khẩu"
              size="large"
            />
          </Form.Item>

          {/* UserDetailDTO */}
          <Form.Item
            name={['userDetailDTO', 'fullName']}
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input placeholder="Họ và tên" size="large" />
          </Form.Item>

          <Form.Item
            name={['userDetailDTO', 'phone']}
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              {
                pattern: /^[0-9]{10,11}$/,
                message: 'Số điện thoại không hợp lệ!',
              },
            ]}
          >
            <Input placeholder="Số điện thoại" size="large" />
          </Form.Item>

          <Form.Item name={['userDetailDTO', 'identificationNumber']} rules={[{ required: false }]}>
            <Input placeholder="Số CCCD/CMND" size="large" />
          </Form.Item>

          <Form.Item
            name={['userDetailDTO', 'gender']}
            rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
          >
            <Select placeholder="Chọn giới tính" size="large">
              {dmGender.map((gender) => (
                <Select.Option key={gender.code} value={gender.code}>
                  {gender.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={loading}
              style={{ width: '100%' }}
              shape="round"
            >
              Tạo tài khoản
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              ghost
              size="large"
              onClick={() => {
                history.push('/auth/login');
              }}
              style={{ width: '100%' }}
              shape="round"
            >
              Trở lại
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default Register;
