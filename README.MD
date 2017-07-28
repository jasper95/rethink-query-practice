DATABASE SCHEMA
EMPLOYEE
-id
-salary_id
-department_id
-first_name
-last_name
-age
-emp_num

DEPARTMENT
-id
-name

SALARY
-id
-grade
-amount

Functionalities:
- Get all salaries '/salaries'
- Get avg salary of all employees by department '/salaries/avg'
- Get all departments '/departments'
- Get all employess and display emp_num, fullname , age, department_name, salary, salary_grade, creationTime sorted by creationTime ASC
    available query parameters
      -global_filter = filters emp_num, fullname , age, department_name, salary, salary_grade
      -name = filters fullname
      -size = limit the result
      -page = specific page used in pagination
