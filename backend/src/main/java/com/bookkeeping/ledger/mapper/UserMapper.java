package com.bookkeeping.ledger.mapper;

import com.bookkeeping.ledger.model.User;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface UserMapper {
  @Select("SELECT * FROM users WHERE id = #{id}")
  User findById(Long id);

  @Select("SELECT * FROM users WHERE username = #{username}")
  User findByUsername(String username);

  @Insert("""
      INSERT INTO users (username, password_hash, display_name)
      VALUES (#{username}, #{passwordHash}, #{displayName})
      """)
  @Options(useGeneratedKeys = true, keyProperty = "id")
  int insert(User user);

  @Update("UPDATE users SET active_account_id = #{accountId} WHERE id = #{userId}")
  int updateActiveAccount(@Param("userId") Long userId, @Param("accountId") Long accountId);

  @Update("UPDATE users SET password_hash = #{passwordHash} WHERE id = #{userId}")
  int updatePassword(@Param("userId") Long userId, @Param("passwordHash") String passwordHash);
}
