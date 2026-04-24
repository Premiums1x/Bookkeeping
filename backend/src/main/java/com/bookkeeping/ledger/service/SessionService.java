package com.bookkeeping.ledger.service;

import com.bookkeeping.ledger.common.BusinessException;
import com.bookkeeping.ledger.web.AuthInterceptor;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class SessionService {
  public Long requireUserId(HttpSession session) {
    Object raw = session == null ? null : session.getAttribute(AuthInterceptor.SESSION_USER_ID);
    if (raw instanceof Long userId) return userId;
    if (raw instanceof Number number) return number.longValue();
    throw new BusinessException("请先登录。", HttpStatus.UNAUTHORIZED);
  }

  public void login(HttpSession session, Long userId) {
    session.setAttribute(AuthInterceptor.SESSION_USER_ID, userId);
  }

  public void logout(HttpSession session) {
    if (session != null) session.invalidate();
  }
}
