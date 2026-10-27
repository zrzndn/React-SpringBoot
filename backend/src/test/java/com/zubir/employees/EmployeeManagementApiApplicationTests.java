package com.zubir.employees;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:employee_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "APP_ADMIN_USERNAME=test-admin",
    "APP_ADMIN_PASSWORD=TestAdminPassword123!"
})
class EmployeeManagementApiApplicationTests {

    @Test
    void contextLoads() {
    }
}