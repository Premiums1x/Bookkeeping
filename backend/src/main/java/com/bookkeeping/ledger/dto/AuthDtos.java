package com.bookkeeping.ledger.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
  private AuthDtos() {}

  public record LoginRequest(
      @NotBlank(message = "请输入账号。") String username,
      @NotBlank(message = "请输入密码。") String password) {}

  public record RegisterRequest(
      @NotBlank(message = "请输入账户名称。")
      @Size(max = 20, message = "账户名称最多 20 个字符。")
      String name,
      @NotBlank(message = "请输入账号。") String username,
      @NotBlank(message = "请输入密码。")
      @Size(min = 6, message = "密码至少 6 位。")
      String password) {}

  public record ChangePasswordRequest(
      @NotBlank(message = "请输入旧密码。") String oldPassword,
      @NotBlank(message = "请输入新密码。")
      @Size(min = 6, message = "新密码至少 6 位。")
      String newPassword) {}

  public record SessionAccount(String id, String name, String username) {}

  public record SessionResponse(boolean authenticated, SessionAccount account) {}
}
