package com.bookkeeping.ledger.service;

import com.bookkeeping.ledger.common.BusinessException;
import com.bookkeeping.ledger.dto.AccountDtos.AccountSummary;
import com.bookkeeping.ledger.dto.AccountDtos.AccountsResponse;
import com.bookkeeping.ledger.dto.LedgerDtos.BudgetResponse;
import com.bookkeeping.ledger.dto.LedgerDtos.LedgerSnapshot;
import com.bookkeeping.ledger.dto.LedgerDtos.PreferencesRequest;
import com.bookkeeping.ledger.dto.LedgerDtos.PreferencesResponse;
import com.bookkeeping.ledger.dto.LedgerDtos.RecordResponse;
import com.bookkeeping.ledger.mapper.LedgerAccountMapper;
import com.bookkeeping.ledger.mapper.RecordMapper;
import com.bookkeeping.ledger.mapper.UserMapper;
import com.bookkeeping.ledger.model.LedgerAccount;
import com.bookkeeping.ledger.model.RecordEntry;
import com.bookkeeping.ledger.model.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LedgerService {
  private static final BigDecimal DEFAULT_BUDGET = BigDecimal.valueOf(7000);
  private static final Set<String> VALID_TYPES = Set.of("all", "expense", "income");
  private static final Set<String> VALID_DATE_FILTERS = Set.of("all", "today", "last7", "custom");

  private final UserMapper userMapper;
  private final LedgerAccountMapper accountMapper;
  private final RecordMapper recordMapper;

  public LedgerService(UserMapper userMapper, LedgerAccountMapper accountMapper, RecordMapper recordMapper) {
    this.userMapper = userMapper;
    this.accountMapper = accountMapper;
    this.recordMapper = recordMapper;
  }

  @Transactional
  public LedgerAccount createDefaultAccount(Long userId, String name) {
    return createAccountForUser(userId, name);
  }

  @Transactional
  public LedgerSnapshot createAccount(Long userId, String name) {
    LedgerAccount account = createAccountForUser(userId, name);
    userMapper.updateActiveAccount(userId, account.getId());
    return snapshot(userId);
  }

  @Transactional
  public AccountsResponse renameAccount(Long userId, Long accountId, String name) {
    requireAccount(userId, accountId);
    accountMapper.updateName(accountId, userId, safeName(name));
    return accounts(userId);
  }

  @Transactional
  public LedgerSnapshot deleteAccount(Long userId, Long accountId) {
    if (accountMapper.countByUserId(userId) <= 1) {
      throw new BusinessException("至少保留一个账本。");
    }
    requireAccount(userId, accountId);
    accountMapper.deleteByIdAndUserId(accountId, userId);
    User user = requireUser(userId);
    if (accountId.equals(user.getActiveAccountId())) {
      Long nextId = accountMapper.findByUserId(userId).get(0).getId();
      userMapper.updateActiveAccount(userId, nextId);
    }
    return snapshot(userId);
  }

  @Transactional
  public LedgerSnapshot switchAccount(Long userId, Long accountId) {
    requireAccount(userId, accountId);
    userMapper.updateActiveAccount(userId, accountId);
    return snapshot(userId);
  }

  public AccountsResponse accounts(Long userId) {
    User user = requireUser(userId);
    LedgerAccount active = ensureActiveAccount(user);
    return new AccountsResponse(String.valueOf(active.getId()), accountSummaries(userId, user.getUsername()));
  }

  public LedgerSnapshot snapshot(Long userId) {
    User user = requireUser(userId);
    LedgerAccount active = ensureActiveAccount(user);
    List<RecordResponse> records = recordMapper.findByAccountId(active.getId()).stream().map(this::toRecordResponse).toList();
    return new LedgerSnapshot(
        true,
        String.valueOf(active.getId()),
        active.getName(),
        user.getUsername(),
        String.valueOf(active.getId()),
        accountSummaries(userId, user.getUsername()),
        active.getMonth(),
        active.getBudget(),
        active.getTypeFilter(),
        active.getDateFilter(),
        active.getDateValue() == null ? "" : active.getDateValue().toString(),
        records);
  }

  @Transactional
  public BudgetResponse updateBudget(Long userId, BigDecimal budget) {
    if (budget == null || budget.compareTo(BigDecimal.ZERO) < 0) {
      throw new BusinessException("预算必须大于等于 0。");
    }
    LedgerAccount active = ensureActiveAccount(requireUser(userId));
    accountMapper.updateBudget(active.getId(), userId, budget);
    return new BudgetResponse(budget);
  }

  @Transactional
  public PreferencesResponse updatePreferences(Long userId, PreferencesRequest request) {
    LedgerAccount active = ensureActiveAccount(requireUser(userId));
    String month = active.getMonth();
    String typeFilter = active.getTypeFilter();
    String dateFilter = active.getDateFilter();
    LocalDate dateValue = active.getDateValue();

    if (request.month() != null) month = normalizeMonth(request.month());
    if (request.typeFilter() != null) typeFilter = normalizeTypeFilter(request.typeFilter());
    if (request.dateInput() != null) {
      DatePreference parsed = parseDateInput(request.dateInput());
      dateFilter = parsed.dateFilter();
      dateValue = parsed.dateValue();
    }
    if (request.dateFilter() != null) {
      dateFilter = normalizeDateFilter(request.dateFilter());
      dateValue = "custom".equals(dateFilter) ? parseDate(request.dateValue(), "自定义日期格式无效。") : null;
    }

    accountMapper.updatePreferences(active.getId(), userId, month, typeFilter, dateFilter, dateValue);
    return new PreferencesResponse(month, typeFilter, dateFilter, dateValue == null ? "" : dateValue.toString());
  }

  LedgerAccount requireActiveAccount(Long userId) {
    return ensureActiveAccount(requireUser(userId));
  }

  private LedgerAccount createAccountForUser(Long userId, String name) {
    LedgerAccount account = new LedgerAccount();
    account.setUserId(userId);
    account.setName(safeName(name));
    account.setBudget(DEFAULT_BUDGET);
    account.setMonth(YearMonth.now().toString());
    account.setTypeFilter("all");
    account.setDateFilter("today");
    account.setDateValue(null);
    accountMapper.insert(account);
    return account;
  }

  private User requireUser(Long userId) {
    User user = userMapper.findById(userId);
    if (user == null) throw new BusinessException("用户不存在。", HttpStatus.UNAUTHORIZED);
    return user;
  }

  private LedgerAccount ensureActiveAccount(User user) {
    LedgerAccount active = user.getActiveAccountId() == null
        ? null
        : accountMapper.findByIdAndUserId(user.getActiveAccountId(), user.getId());
    if (active != null) return active;

    List<LedgerAccount> accounts = accountMapper.findByUserId(user.getId());
    if (accounts.isEmpty()) {
      active = createAccountForUser(user.getId(), "默认账本");
    } else {
      active = accounts.get(0);
    }
    userMapper.updateActiveAccount(user.getId(), active.getId());
    return active;
  }

  private LedgerAccount requireAccount(Long userId, Long accountId) {
    LedgerAccount account = accountMapper.findByIdAndUserId(accountId, userId);
    if (account == null) throw new BusinessException("账本不存在。", HttpStatus.NOT_FOUND);
    return account;
  }

  private List<AccountSummary> accountSummaries(Long userId, String username) {
    return accountMapper.findByUserId(userId).stream()
        .map(account -> new AccountSummary(
            String.valueOf(account.getId()),
            account.getName(),
            username,
            account.getMonth(),
            account.getBudget(),
            recordMapper.countByAccountId(account.getId())))
        .toList();
  }

  private RecordResponse toRecordResponse(RecordEntry record) {
    return new RecordResponse(
        record.getId(),
        record.getType(),
        record.getAmount(),
        record.getCategory(),
        record.getNote(),
        record.getRecordDate());
  }

  private String safeName(String value) {
    String name = value == null ? "" : value.trim();
    if (name.isEmpty()) throw new BusinessException("账本名称不能为空。");
    return name.length() > 20 ? name.substring(0, 20) : name;
  }

  private String normalizeMonth(String value) {
    try {
      return YearMonth.parse(value).toString();
    } catch (Exception ex) {
      throw new BusinessException("月份格式错误，应为 YYYY-MM。");
    }
  }

  private String normalizeTypeFilter(String value) {
    String normalized = value == null ? "" : value.trim().toLowerCase();
    if (!VALID_TYPES.contains(normalized)) throw new BusinessException("类型筛选无效。");
    return normalized;
  }

  private String normalizeDateFilter(String value) {
    String normalized = value == null ? "" : value.trim().toLowerCase();
    if (!VALID_DATE_FILTERS.contains(normalized)) throw new BusinessException("日期筛选无效。");
    return normalized;
  }

  private LocalDate parseDate(String value, String errorMessage) {
    try {
      return LocalDate.parse(value);
    } catch (Exception ex) {
      throw new BusinessException(errorMessage);
    }
  }

  private DatePreference parseDateInput(String input) {
    String value = input == null ? "" : input.trim().toLowerCase();
    if ("all".equals(value) || "全部".equals(value)) return new DatePreference("all", null);
    if ("today".equals(value) || "今天".equals(value)) return new DatePreference("today", null);
    if ("7".equals(value) || "week".equals(value) || "近7天".equals(value)) return new DatePreference("last7", null);
    return new DatePreference("custom", parseDate(value, "日期筛选输入无效。"));
  }

  private record DatePreference(String dateFilter, LocalDate dateValue) {}
}
