package com.bookkeeping.ledger.controller;

import com.bookkeeping.ledger.common.ApiResponse;
import com.bookkeeping.ledger.dto.AuthDtos.ChangePasswordRequest;
import com.bookkeeping.ledger.dto.AuthDtos.LoginRequest;
import com.bookkeeping.ledger.dto.AuthDtos.RegisterRequest;
import com.bookkeeping.ledger.dto.AuthDtos.SessionResponse;
import com.bookkeeping.ledger.dto.LedgerDtos.LedgerSnapshot;
import com.bookkeeping.ledger.service.AuthService;
import com.bookkeeping.ledger.service.AuthService.AuthResult;
import com.bookkeeping.ledger.service.SessionService;
import com.bookkeeping.ledger.web.AuthInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;
  private final SessionService sessionService;

  public AuthController(AuthService authService, SessionService sessionService) {
    this.authService = authService;
    this.sessionService = sessionService;
  }

  @GetMapping("/session")
  public ApiResponse<SessionResponse> session(HttpServletRequest request) {
    HttpSession session = request.getSession(false);
    Object raw = session == null ? null : session.getAttribute(AuthInterceptor.SESSION_USER_ID);
    Long userId = raw instanceof Number number ? number.longValue() : null;
    return ApiResponse.ok(authService.session(userId));
  }

  @PostMapping("/login")
  public ApiResponse<LedgerSnapshot> login(@Valid @RequestBody LoginRequest request, HttpSession session) {
    AuthResult result = authService.login(request);
    sessionService.login(session, result.userId());
    return ApiResponse.ok(result.snapshot());
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<LedgerSnapshot> register(@Valid @RequestBody RegisterRequest request, HttpSession session) {
    AuthResult result = authService.register(request);
    sessionService.login(session, result.userId());
    return ApiResponse.ok(result.snapshot());
  }

  @PostMapping("/logout")
  public ApiResponse<SessionResponse> logout(HttpSession session) {
    sessionService.logout(session);
    return ApiResponse.ok(new SessionResponse(false, null));
  }

  @PutMapping("/password")
  public ApiResponse<Map<String, Boolean>> changePassword(
      @Valid @RequestBody ChangePasswordRequest request,
      HttpSession session) {
    authService.changePassword(sessionService.requireUserId(session), request);
    return ApiResponse.ok(Map.of("success", true));
  }
}
