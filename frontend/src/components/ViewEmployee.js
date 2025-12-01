import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Avatar,
  Card,
  CardContent,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { employeeAPI } from '../services/api';

const ViewEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeAPI.getById(id),
    select: (response) => response.data,
  });

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (!employee) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography color="error">Employee not found</Typography>
          <Button onClick={() => navigate('/employees')} sx={{ mt: 2 }}>
            Back to Employees
          </Button>
        </Box>
      </Container>
    );
  }

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const baseURL = API_URL.replace('/api', '');
  const profilePictureUrl = employee.profilePicture
    ? `${baseURL}${employee.profilePicture}`
    : null;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/employees')}
          sx={{ mb: 2 }}
        >
          Back to Employees
        </Button>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            View Employee Details
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Avatar
                  src={profilePictureUrl}
                  sx={{ width: 150, height: 150, margin: '0 auto' }}
                >
                  {!profilePictureUrl && 'No Image'}
                </Avatar>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Employee First Name
                    </Typography>
                    <Typography variant="h6">{employee.firstName}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Employee Last Name
                    </Typography>
                    <Typography variant="h6">{employee.lastName}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Employee Email Address
                    </Typography>
                    <Typography variant="h6">{employee.email}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              {employee.phoneNumber && (
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Phone Number
                      </Typography>
                      <Typography variant="h6">{employee.phoneNumber}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Department
                    </Typography>
                    <Typography variant="h6">{employee.department}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Position
                    </Typography>
                    <Typography variant="h6">{employee.position}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              {employee.salary && (
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Salary
                      </Typography>
                      <Typography variant="h6">
                        ${employee.salary.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/employees/${id}/edit`)}
              >
                Update Employee
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ViewEmployee;

