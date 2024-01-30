export const formConfig: FormConfig = {
  fields: [
    {
      type: 'text',
      label: 'Name',
      name: 'name',
      required: true,
      dataType: 'string',
    },
    {
      type: 'text',
      label: 'Email',
      name: 'email',
      required: true,
      pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      dataType: 'string',
    },
    {
      type: 'text',
      label: 'Address',
      name: 'address',
      required: true,
      dataType: 'string',
    },
    {
      type: 'select',
      label: 'Gender',
      name: 'gender',
      options: ['Male', 'Female', 'Other'],
      required: true,
      dataType: 'string',
    },
    {
      type: 'select',
      label: 'Age',
      name: 'age',
      options: ['Under 20', '20-60', 'Over 60'],
      required: true,
      dataType: 'string',
    },
    {
      type: 'checkbox',
      label: 'Terms and Conditions Approval',
      name: 'termsApproval',
      required: true,
      dataType: 'boolean',
    },
    {
      type: 'checkbox',
      label: 'Enable Tracking',
      name: 'enableTracking',
      required: false,
      dataType: 'boolean',
    },
  ],
};

type FormField = {
  type: 'text' | 'select' | 'checkbox';
  label: string;
  name: string;
  required: boolean;
  dataType: 'string' | 'boolean' | 'number';
  pattern?: string;
  options?: string[];
};

type FormConfig = {
  fields: FormField[];
};
