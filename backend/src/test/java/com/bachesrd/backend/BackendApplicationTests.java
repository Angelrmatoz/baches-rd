package com.bachesrd.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = "JWT_SECRET=074142544c0e3e63e4c3c1ae7b76bd8852a40e3d3a45665b9393b59f85f6881e")
@ActiveProfiles("dev")
class BackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
