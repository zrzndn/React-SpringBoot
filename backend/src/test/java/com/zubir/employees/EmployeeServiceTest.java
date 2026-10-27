package com.zubir.employees;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    void createTrimsEmployeeDetails() {
        when(employeeRepository.save(any(Employee.class)))
            .thenAnswer(invocation ->
                (Employee) invocation.getArgument(0));

        Employee result = employeeService.create(
            new EmployeeRequest(" Ahmad Zubir ", " Technology ")
        );

        assertThat(result.getName()).isEqualTo("Ahmad Zubir");
        assertThat(result.getDepartment()).isEqualTo("Technology");
        verify(employeeRepository).save(any(Employee.class));
    }

    @Test
    void missingEmployeeReturns404() {
        when(employeeRepository.findById(999L))
            .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> employeeService.findById(999L)
        );

        assertThat(exception.getStatusCode().value()).isEqualTo(404);
    }
}
