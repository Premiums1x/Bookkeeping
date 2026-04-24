package com.bookkeeping.ledger.config;

import com.bookkeeping.ledger.web.AuthInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  private final AuthInterceptor authInterceptor;
  private final String allowedOrigin;

  public WebConfig(AuthInterceptor authInterceptor, @Value("${ledger.cors.allowed-origin}") String allowedOrigin) {
    this.authInterceptor = authInterceptor;
    this.allowedOrigin = allowedOrigin;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(authInterceptor)
        .addPathPatterns("/api/**")
        .excludePathPatterns("/api/auth/session", "/api/auth/login", "/api/auth/register");
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins(allowedOrigin)
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowCredentials(true)
        .allowedHeaders("*");
  }
}
