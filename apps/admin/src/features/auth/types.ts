export type StaffLoginField = 'email' | 'password' | 'factor';

export type StaffLoginValidation = {
  field: StaffLoginField;
  message: string;
};
