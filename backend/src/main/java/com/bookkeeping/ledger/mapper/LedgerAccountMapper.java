package com.bookkeeping.ledger.mapper;

import com.bookkeeping.ledger.model.LedgerAccount;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface LedgerAccountMapper {
  @Select("SELECT * FROM ledger_accounts WHERE user_id = #{userId} ORDER BY id ASC")
  List<LedgerAccount> findByUserId(Long userId);

  @Select("SELECT * FROM ledger_accounts WHERE id = #{id} AND user_id = #{userId}")
  LedgerAccount findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

  @Select("SELECT COUNT(*) FROM ledger_accounts WHERE user_id = #{userId}")
  int countByUserId(Long userId);

  @Insert("""
      INSERT INTO ledger_accounts (user_id, name, budget, month, type_filter, date_filter, date_value)
      VALUES (#{userId}, #{name}, #{budget}, #{month}, #{typeFilter}, #{dateFilter}, #{dateValue})
      """)
  @Options(useGeneratedKeys = true, keyProperty = "id")
  int insert(LedgerAccount account);

  @Update("UPDATE ledger_accounts SET name = #{name} WHERE id = #{id} AND user_id = #{userId}")
  int updateName(@Param("id") Long id, @Param("userId") Long userId, @Param("name") String name);

  @Update("UPDATE ledger_accounts SET budget = #{budget} WHERE id = #{id} AND user_id = #{userId}")
  int updateBudget(@Param("id") Long id, @Param("userId") Long userId, @Param("budget") BigDecimal budget);

  @Update("""
      UPDATE ledger_accounts
      SET month = #{month},
          type_filter = #{typeFilter},
          date_filter = #{dateFilter},
          date_value = #{dateValue}
      WHERE id = #{id} AND user_id = #{userId}
      """)
  int updatePreferences(
      @Param("id") Long id,
      @Param("userId") Long userId,
      @Param("month") String month,
      @Param("typeFilter") String typeFilter,
      @Param("dateFilter") String dateFilter,
      @Param("dateValue") LocalDate dateValue);

  @Delete("DELETE FROM ledger_accounts WHERE id = #{id} AND user_id = #{userId}")
  int deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
