package com.bookkeeping.ledger.service;

import com.bookkeeping.ledger.common.BusinessException;
import com.bookkeeping.ledger.dto.AuthDtos.ChangePasswordRequest;
import com.bookkeeping.ledger.dto.AuthDtos.LoginRequest;
import com.bookkeeping.ledger.dto.AuthDtos.RegisterRequest;
import com.bookkeeping.ledger.dto.AuthDtos.SessionAccount;
import com.bookkeeping.ledger.dto.AuthDtos.SessionResponse;
import com.bookkeeping.ledger.dto.LedgerDtos.LedgerSnapshot;
import com.bookkeeping.ledger.mapper.UserMapper;
import com.bookkeeping.ledger.model.LedgerAccount;
import com.bookkeeping.ledger.model.User;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private static final Pattern USERNAME_RULE = Pattern.compile("^[a-z0-9_]{3,20}$");

  private final UserMapper userMapper;
  private final LedgerService ledgerService;
  private final PasswordEncoder passwordEncoder;

  public AuthService(UserMapper userMapper, LedgerService ledgerService, PasswordEncoder passwordEncoder) {
    this.userMapper = userMapper;
    this.ledgerService = ledgerService;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public AuthResult register(RegisterRequest request) {
    String username = normalizeUsername(request.username());
    if (!USERNAME_RULE.matcher(username).matches()) {
      throw new BusinessException("账号格式无效（3-20位小写字母/数字/下划线）。");
    }
    if (userMapper.findByUsername(username) != null) {
      throw new BusinessException("账号已存在。");
    }

    User user = new User();
    user.setUsername(username);
    user.setDisplayName(safeDisplayName(request.name(), username));
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    userMapper.insert(user);

    LedgerAccount account = ledgerService.createDefaultAccount(user.getId(), user.getDisplayName());
    userMapper.updateActiveAccount(user.getId(), account.getId());
    return new AuthResult(user.getId(), ledgerService.snapshot(user.getId()));
  }

  public AuthResult login(LoginRequest request) {
    String username = normalizeUsername(request.username());
    if (!USERNAME_RULE.matcher(username).matches()) {
      throw new BusinessException("账号格式无效（3-20位小写字母/数字/下划线）。");
    }

    User user = userMapper.findByUsername(username);
    if (user == null) throw new BusinessException("账号不存在。", HttpStatus.NOT_FOUND);
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new BusinessException("密码错误。", HttpStatus.UNAUTHORIZED);
    }
    return new AuthResult(user.getId(), ledgerService.snapshot(user.getId()));
  }

  public SessionResponse session(Long userId) {
    if (userId == null) return new SessionResponse(false, null);
    User user = userMapper.findById(userId);
    if (user == null) return new SessionResponse(false, null);
    LedgerSnapshot snapshot = ledgerService.snapshot(userId);
    return new SessionResponse(
        true,
        new SessionAccount(snapshot.accountId(), snapshot.accountName(), user.getUsername()));
  }

  @Transactional
  public void changePassword(Long userId, ChangePasswordRequest request) {
    User user = userMapper.findById(userId);
    if (user == null) throw new BusinessException("用户不存在。", HttpStatus.UNAUTHORIZED);
    if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
      throw new BusinessException("旧密码错误。", HttpStatus.UNAUTHORIZED);
    }
    userMapper.updatePassword(userId, passwordEncoder.encode(request.newPassword()));
  }

  private String normalizeUsername(String value) {
    return value == null ? "" : value.trim().toLowerCase();
  }

  private String safeDisplayName(String value, String fallback) {
    String name = value == null ? "" : value.trim();
    if (name.isEmpty()) return fallback;
    return name.length() > 20 ? name.substring(0, 20) : name;
  }

  public record AuthResult(Long userId, LedgerSnapshot snapshot) {}
}
