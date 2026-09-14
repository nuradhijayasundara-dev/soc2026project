package com.backhaulmatch.matching.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        // The default request factory (HttpURLConnection-based) can't send PATCH
        // requests — throws "Invalid HTTP method: PATCH" at runtime. This service
        // calls fleet-service's PATCH /reserve and /release endpoints directly, so
        // it needs a factory that actually supports PATCH.
        return new RestTemplate(new JdkClientHttpRequestFactory());
    }
}
