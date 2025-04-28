# Frontend Implementation Plan

This document provides detailed technical specifications and implementation guidelines for the frontend of the Collection CRM system.

## 1. Overview

The Collection CRM frontend is a web-based application built with React and TypeScript. It provides a user interface for collection agents, supervisors, and administrators to manage collection activities, view customer and loan information, record actions, and track performance.

## 2. Technical Architecture

### 2.1 Technology Stack

- **Framework**: React 18+
- **Language**: TypeScript 5.0+
- **State Management**: Redux Toolkit
- **UI Component Library**: Material-UI (MUI)
- **Form Handling**: React Hook Form
- **API Client**: Axios
- **Data Visualization**: D3.js / Chart.js
- **Testing**: Jest, React Testing Library
- **Build Tool**: Vite

### 2.2 Architecture Overview

The frontend follows a modular architecture with the following key components:

1. **Core Framework**
   - Application initialization
   - Routing
   - State management
   - Authentication
   - Error handling

2. **Shared Components**
   - UI components
   - Form components
   - Data display components
   - Navigation components
   - Layout components

3. **Feature Modules**
   - Customer management
   - Loan management
   - Collection workflow
   - Agent management
   - Reporting and analytics

4. **Services**
   - API services
   - Authentication service
   - Notification service
   - Storage service
   - Utility services

### 2.3 Directory Structure

```
src/
├── assets/            # Static assets (images, fonts, etc.)
├── components/        # Shared components
│   ├── common/        # Common UI components
│   ├── forms/         # Form components
│   ├── layout/        # Layout components
│   └── data/          # Data display components
├── features/          # Feature modules
│   ├── auth/          # Authentication feature
│   ├── customers/     # Customer management feature
│   ├── loans/         # Loan management feature
│   ├── collection/    # Collection workflow feature
│   ├── agents/        # Agent management feature
│   └── reports/       # Reporting and analytics feature
├── hooks/             # Custom React hooks
├── services/          # Services
│   ├── api/           # API services
│   ├── auth/          # Authentication service
│   ├── notification/  # Notification service
│   └── storage/       # Storage service
├── store/             # Redux store
│   ├── slices/        # Redux slices
│   └── middleware/    # Redux middleware
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── App.tsx            # Root component
├── main.tsx           # Entry point
└── vite-env.d.ts      # Vite environment types

## 3. Core Components

### 3.1 Authentication

#### Implementation Details

```typescript
// Authentication Slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/auth';

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(username, password);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);

export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await authService.validateToken(auth.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Token validation failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(validateToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

#### Components

1. **LoginForm**: Form for user authentication
2. **PrivateRoute**: Route component that requires authentication
3. **AuthProvider**: Context provider for authentication state
4. **UserProfile**: Component to display and edit user profile

### 3.2 API Service

#### Implementation Details

```typescript
// API Service
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          store.dispatch(logout());
        }
        return Promise.reject(error);
      }
    );
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }
}

export const apiService = new ApiService();
```

### 3.3 Layout Components

#### Implementation Details

```typescript
// Layout Component
import React from 'react';
import { Box, CssBaseline, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton } from '@mui/material';
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import { MainNavigation } from './MainNavigation';
import { UserMenu } from './UserMenu';
import { Breadcrumbs } from './Breadcrumbs';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

export const Layout: React.FC = () => {
  const [open, setOpen] = React.useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Collection CRM
          </Typography>
          <UserMenu />
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
          <Divider />
          <MainNavigation />
        </Box>
      </Drawer>
      <Main open={open}>
        <Toolbar />
        <Breadcrumbs />
        <Box sx={{ mt: 2 }}>
          <Outlet />
        </Box>
      </Main>
    </Box>
  );
};
```

## 4. Feature Modules

### 4.1 Customer Management

#### Key Components

1. **CustomerSearch**: Search for customers by various criteria
2. **CustomerList**: Display list of customers with pagination
3. **CustomerDetails**: Display customer details with tabs for different sections
4. **CustomerContacts**: Manage customer contact information
5. **CustomerLoans**: Display customer loans
6. **CustomerCollaterals**: Display customer collaterals
7. **CustomerActions**: Display and record customer actions
8. **CustomerCases**: Manage customer cases

#### Implementation Details

```typescript
// Customer Search Component
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Box, TextField, Button, Grid, Card, CardContent } from '@mui/material';
import { searchCustomers } from '../../store/slices/customerSlice';

export const CustomerSearch: React.FC = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useState({
    cif: '',
    name: '',
    nationalId: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(searchCustomers(searchParams));
  };

  const handleReset = () => {
    setSearchParams({
      cif: '',
      name: '',
      nationalId: '',
      phone: '',
    });
  };

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="CIF"
                name="cif"
                value={searchParams.cif}
                onChange={handleChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={searchParams.name}
                onChange={handleChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="National ID"
                name="nationalId"
                value={searchParams.nationalId}
                onChange={handleChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={searchParams.phone}
                onChange={handleChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" onClick={handleReset}>
                  Reset
                </Button>
                <Button variant="contained" type="submit">
                  Search
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};
```

### 4.2 Loan Management

#### Key Components

1. **LoanSearch**: Search for loans by various criteria
2. **LoanList**: Display list of loans with pagination
3. **LoanDetails**: Display loan details with tabs for different sections
4. **LoanPayments**: Display loan payment history
5. **LoanCollaterals**: Display loan collaterals
6. **LoanActions**: Display and record loan actions
7. **DueSegmentation**: Display due segmentation details

#### Implementation Details

```typescript
// Loan Details Component
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Card, CardContent, Typography, Tabs, Tab, Chip, Grid } from '@mui/material';
import { getLoanDetails } from '../../store/slices/loanSlice';
import { LoanPayments } from './LoanPayments';
import { LoanCollaterals } from './LoanCollaterals';
import { LoanActions } from './LoanActions';
import { DueSegmentation } from './DueSegmentation';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`loan-tabpanel-${index}`}
      aria-labelledby={`loan-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const LoanDetails: React.FC = () => {
  const { accountNumber } = useParams<{ accountNumber: string }>();
  const dispatch = useDispatch();
  const { loan, isLoading, error } = useSelector((state: RootState) => state.loan);
  const [tabValue, setTabValue] = React.useState(0);

  useEffect(() => {
    if (accountNumber) {
      dispatch(getLoanDetails(accountNumber));
    }
  }, [dispatch, accountNumber]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!loan) {
    return <div>No loan found</div>;
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Loan Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Account Number</Typography>
              <Typography variant="body1">{loan.accountNumber}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Customer</Typography>
              <Typography variant="body1">{loan.customerName} (CIF: {loan.cif})</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Product Type</Typography>
              <Typography variant="body1">{loan.productType}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Status</Typography>
              <Chip
                label={loan.status}
                color={loan.status === 'OPEN' ? 'success' : 'default'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Original Amount</Typography>
              <Typography variant="body1">{formatCurrency(loan.originalAmount, loan.currency)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Outstanding</Typography>
              <Typography variant="body1">{formatCurrency(loan.outstanding, loan.currency)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Due Amount</Typography>
              <Typography variant="body1" color="error">
                {formatCurrency(loan.dueAmount, loan.currency)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Days Past Due</Typography>
              <Typography variant="body1" color={loan.dpd > 0 ? 'error' : 'inherit'}>
                {loan.dpd}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Disbursement Date</Typography>
              <Typography variant="body1">{formatDate(loan.disbursementDate)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Maturity Date</Typography>
              <Typography variant="body1">{formatDate(loan.maturityDate)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Next Payment Date</Typography>
              <Typography variant="body1">{formatDate(loan.nextPaymentDate)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="loan tabs">
          <Tab label="Payments" />
          <Tab label="Collaterals" />
          <Tab label="Actions" />
          <Tab label="Due Segmentation" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <LoanPayments accountNumber={loan.accountNumber} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <LoanCollaterals accountNumber={loan.accountNumber} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <LoanActions accountNumber={loan.accountNumber} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <DueSegmentation accountNumber={loan.accountNumber} />
        </TabPanel>
      </Box>
    </Box>
  );
};
### 4.3 Collection Workflow

#### Key Components

1. **ActionRecording**: Record collection actions
2. **TaskList**: Display and manage collection tasks
3. **CaseManagement**: Manage customer cases
4. **AgentAssignment**: Assign customers to agents
5. **WorkflowDashboard**: Display workflow metrics and status

#### Implementation Details

```typescript
// Action Recording Component
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { recordAction } from '../../store/slices/actionSlice';
import { ActionType, ActionSubType, ActionResultType } from '../../types/action';

interface ActionFormData {
  type: ActionType;
  subtype: ActionSubType;
  actionResult: ActionResultType;
  actionDate: Date;
  notes: string;
  callTraceId?: string;
  visitLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface ActionRecordingProps {
  cif: string;
  loanAccountNumber?: string;
}

export const ActionRecording: React.FC<ActionRecordingProps> = ({ cif, loanAccountNumber }) => {
  const dispatch = useDispatch();
  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<ActionFormData>({
    defaultValues: {
      type: undefined,
      subtype: undefined,
      actionResult: undefined,
      actionDate: new Date(),
      notes: '',
    },
  });

  const actionType = watch('type');

  const onSubmit = (data: ActionFormData) => {
    dispatch(recordAction({
      ...data,
      cif,
      loanAccountNumber,
    }));
    reset();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Record Action
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="type"
                control={control}
                rules={{ required: 'Action type is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>Action Type</InputLabel>
                    <Select {...field} label="Action Type">
                      <MenuItem value={ActionType.CALL}>Call</MenuItem>
                      <MenuItem value={ActionType.SMS}>SMS</MenuItem>
                      <MenuItem value={ActionType.EMAIL}>Email</MenuItem>
                      <MenuItem value={ActionType.LETTER}>Letter</MenuItem>
                      <MenuItem value={ActionType.VISIT}>Visit</MenuItem>
                      <MenuItem value={ActionType.MEETING}>Meeting</MenuItem>
                      <MenuItem value={ActionType.CASE_REVIEW}>Case Review</MenuItem>
                      <MenuItem value={ActionType.PAYMENT_ARRANGEMENT}>Payment Arrangement</MenuItem>
                      <MenuItem value={ActionType.NOTE}>Note</MenuItem>
                    </Select>
                    {errors.type && (
                      <Typography variant="caption" color="error">
                        {errors.type.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="subtype"
                control={control}
                rules={{ required: 'Action subtype is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.subtype}>
                    <InputLabel>Action Subtype</InputLabel>
                    <Select {...field} label="Action Subtype">
                      {actionType === ActionType.CALL && (
                        <>
                          <MenuItem value={ActionSubType.CALL_OUTBOUND}>Outbound Call</MenuItem>
                          <MenuItem value={ActionSubType.CALL_INBOUND}>Inbound Call</MenuItem>
                          <MenuItem value={ActionSubType.CALL_FOLLOWUP}>Follow-up Call</MenuItem>
                        </>
                      )}
                      {actionType === ActionType.SMS && (
                        <>
                          <MenuItem value={ActionSubType.SMS_REMINDER}>Payment Reminder</MenuItem>
                          <MenuItem value={ActionSubType.SMS_CONFIRMATION}>Confirmation</MenuItem>
                          <MenuItem value={ActionSubType.SMS_INFORMATION}>Information</MenuItem>
                        </>
                      )}
                      {/* Other subtypes based on action type */}
                      <MenuItem value={ActionSubType.OTHER}>Other</MenuItem>
                    </Select>
                    {errors.subtype && (
                      <Typography variant="caption" color="error">
                        {errors.subtype.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="actionResult"
                control={control}
                rules={{ required: 'Action result is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.actionResult}>
                    <InputLabel>Action Result</InputLabel>
                    <Select {...field} label="Action Result">
                      <MenuItem value={ActionResultType.CONTACTED}>Contacted</MenuItem>
                      <MenuItem value={ActionResultType.NOT_CONTACTED}>Not Contacted</MenuItem>
                      <MenuItem value={ActionResultType.LEFT_MESSAGE}>Left Message</MenuItem>
                      <MenuItem value={ActionResultType.PROMISE_TO_PAY}>Promise to Pay</MenuItem>
                      <MenuItem value={ActionResultType.PAYMENT_MADE}>Payment Made</MenuItem>
                      <MenuItem value={ActionResultType.DISPUTE}>Dispute</MenuItem>
                      <MenuItem value={ActionResultType.HARDSHIP_CLAIM}>Hardship Claim</MenuItem>
                      <MenuItem value={ActionResultType.REFUSED}>Refused</MenuItem>
                      <MenuItem value={ActionResultType.PENDING}>Pending</MenuItem>
                      <MenuItem value={ActionResultType.COMPLETED}>Completed</MenuItem>
                      <MenuItem value={ActionResultType.FAILED}>Failed</MenuItem>
                    </Select>
                    {errors.actionResult && (
                      <Typography variant="caption" color="error">
                        {errors.actionResult.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="actionDate"
                control={control}
                rules={{ required: 'Action date is required' }}
                render={({ field }) => (
                  <DateTimePicker
                    label="Action Date"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.actionDate,
                        helperText: errors.actionDate?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>
            {actionType === ActionType.CALL && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="callTraceId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Call Trace ID"
                      variant="outlined"
                    />
                  )}
                />
              </Grid>
            )}
            {actionType === ActionType.VISIT && (
              <>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="visitLocation.latitude"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Latitude"
                        type="number"
                        variant="outlined"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="visitLocation.longitude"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Longitude"
                        type="number"
                        variant="outlined"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="visitLocation.address"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Address"
                        variant="outlined"
                      />
                    )}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                rules={{ required: 'Notes are required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Notes"
                    multiline
                    rows={4}
                    variant="outlined"
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" type="submit">
                  Record Action
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};
```

### 4.4 Agent Management

#### Key Components

1. **AgentList**: Display list of agents with filtering
2. **AgentDetails**: Display agent details and performance
3. **AgentAssignments**: Display and manage agent assignments
4. **AgentPerformance**: Display agent performance metrics
5. **TeamManagement**: Manage teams and team assignments

#### Implementation Details

```typescript
// Agent Performance Component
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getAgentPerformance } from '../../store/slices/agentSlice';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

export const AgentPerformance: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const dispatch = useDispatch();
  const { performance, isLoading, error } = useSelector((state: RootState) => state.agent);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (agentId) {
      dispatch(getAgentPerformance({ agentId, period }));
    }
  }, [dispatch, agentId, period]);

  const handlePeriodChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPeriod(event.target.value as string);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!performance) {
    return <div>No performance data found</div>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Agent Performance</Typography>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} onChange={handlePeriodChange} label="Period">
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Actions Completed
              </Typography>
              <Typography variant="h4">{formatNumber(performance.actionsCompleted)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Promises to Pay
              </Typography>
              <Typography variant="h4">{formatNumber(performance.promisesToPay)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Payments Collected
              </Typography>
              <Typography variant="h4">{formatCurrency(performance.paymentsCollected, 'USD')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Success Rate
              </Typography>
              <Typography variant="h4">{formatNumber(performance.successRate)}%</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions by Type
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performance.actionsByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performance.performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="actions"
                      stroke="#8884d8"
                      name="Actions"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="payments"
                      stroke="#82ca9d"
                      name="Payments"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Actions
              </Typography>
              {/* Table of recent actions */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
```

## 5. Implementation Phases

### 5.1 Phase 1: Core Framework (Weeks 1-3)

- Set up project structure
- Configure build tools and dependencies
- Implement routing
- Set up state management
- Create authentication flow
- Implement API service
- Create layout components

### 5.2 Phase 2: Shared Components (Weeks 3-5)

- Implement UI component library
- Create form components
- Develop data display components
- Implement navigation components
- Create utility functions
- Set up testing framework

### 5.3 Phase 3: Customer Management (Weeks 5-7)

- Implement customer search
- Create customer list
- Develop customer details view
- Implement contact management
- Create customer loans view
- Develop customer collaterals view
- Implement customer actions

### 5.4 Phase 4: Loan Management (Weeks 7-9)

- Implement loan search
- Create loan list
- Develop loan details view
- Implement payment history
- Create collateral management
- Develop due segmentation view
- Implement loan actions

### 5.5 Phase 5: Collection Workflow (Weeks 9-11)

- Implement action recording
- Create task management
- Develop case management
- Implement agent assignment
- Create workflow dashboard
- Develop status tracking

### 5.6 Phase 6: Agent Management (Weeks 11-13)

- Implement agent list
- Create agent details view
- Develop agent assignments
- Implement performance metrics
- Create team management
- Develop reporting

### 5.7 Phase 7: Integration and Testing (Weeks 13-15)

- Integrate all modules
- Implement end-to-end workflows
- Perform unit testing
- Conduct integration testing
- Implement error handling
- Optimize performance

### 5.8 Phase 8: Deployment and Documentation (Weeks 15-16)

- Create production build
- Deploy to staging environment
- Conduct user acceptance testing
- Create user documentation
- Develop technical documentation
- Deploy to production

## 6. Conclusion

The frontend implementation plan provides a comprehensive roadmap for developing the Collection CRM web application. By following this plan, the development team can create a robust, user-friendly interface that meets the requirements of collection agents, supervisors, and administrators.

The modular architecture ensures that the application is maintainable, scalable, and extensible. The use of modern technologies like React, TypeScript, and Material-UI provides a solid foundation for building a high-quality application.

The implementation phases are designed to deliver value incrementally, with each phase building on the previous one. This approach allows for early feedback and course correction if needed.
```
