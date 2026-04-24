package com.bookkeeping.ledger.controller;

import com.bookkeeping.ledger.common.ApiResponse;
import com.bookkeeping.ledger.dto.LedgerDtos.BudgetRequest;
import com.bookkeeping.ledger.dto.LedgerDtos.BudgetResponse;
import com.bookkeeping.ledger.dto.LedgerDtos.LedgerSnapshot;
import com.bookkeeping.ledger.dto.LedgerDtos.PreferencesRequest;
import com.bookkeeping.ledger.dto.LedgerDtos.PreferencesResponse;
import com.bookkeeping.ledger.service.LedgerService;
import com.bookkeeping.ledger.service.SessionService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LedgerController {
  private final LedgerService ledgerService;
  private final SessionService sessionService;

  public LedgerController(LedgerService ledgerService, SessionService sessionService) {
    this.ledgerService = ledgerService;
    this.sessionService = sessionService;
  }

  @GetMapping("/ledger")
  public ApiResponse<LedgerSnapshot> ledger(HttpSession session) {
    return ApiResponse.ok(ledgerService.snapshot(sessionService.requireUserId(session)));
  }

  @PutMapping("/budget")
  public ApiResponse<BudgetResponse> budget(@RequestBody BudgetRequest request, HttpSession session) {
    return ApiResponse.ok(ledgerService.updateBudget(sessionService.requireUserId(session), request.budget()));
  }

  @PutMapping("/preferences")
  public ApiResponse<PreferencesResponse> preferences(@RequestBody PreferencesRequest request, HttpSession session) {
    return ApiResponse.ok(ledgerService.updatePreferences(sessionService.requireUserId(session), request));
  }
}
