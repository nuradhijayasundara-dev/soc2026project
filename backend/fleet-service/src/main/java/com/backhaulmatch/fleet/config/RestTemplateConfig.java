package com.backhaulmatch.fleet.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    /**
     * @LoadBalanced lets us call http://COURIER-SERVICE/... using the Eureka
     * service name instead of a hardcoded host:port — Spring Cloud resolves
     * it to a live instance at request time.
     *
     * Uses JdkClientHttpRequestFactory (not the default HttpURLConnection-based
     * one) because CourierServiceClient.updateShipmentStatus() sends a PATCH
     * request — the default factory throws "Invalid HTTP method: PATCH" at
     * runtime. Same fix matching-service already needed for its own PATCH
     * calls to fleet-service (see matching-service/config/RestTemplateConfig).
     */
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate(new JdkClientHttpRequestFactory());
    }
}
