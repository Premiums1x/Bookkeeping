package com.bookkeeping.ledger.web;

import com.bookkeeping.ledger.common.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {
  public static final String SESSION_USER_ID = "LOGIN_USER_ID";

  private final ObjectMapper objectMapper;

  public AuthInterceptor(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
    Object userId = request.getSession(false) == null ? null : request.getSession(false).getAttribute(SESSION_USER_ID);
    if (userId != null) return true;

    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");
    response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.fail("请先登录。")));
    return false;
  }
}
