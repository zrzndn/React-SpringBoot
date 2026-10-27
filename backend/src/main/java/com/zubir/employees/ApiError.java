package com.zubir.employees;

import java.util.Map;

public record ApiError(
    int status,
    String message,
    Map<String, String> fieldErrors
) {}
