#!/bin/bash
#脚本执行的路径
rpm_package_dir="$(pwd)"
#存放加压的rpm包和spec文件的更目录
root_dir=""
rpm_package_extract_directory=""
rpm_package_jars_backup=""
jetty_upgrade_jars_dir="/data/labo/rpmbackup/jetty-upgrade-jars/"
jetty_upgrade_rpms_dir="/data/labo/rpmbackup/jetty-upgrade-rpms/"
jetty_prefix_path="usr/dif/7.1.0-0/"

# ambari-infra-solr-2.7.3.0-139.noarch.rpm ambari-server-2.7.3.0-139.x86_64.rpm 


#要进行打包的rpm目录
rpm_root_dir=""
rpms_map_to_jetty_path=(
    "hadoop_7_1_0_0-client-3.3.0.7.1.0-0.x86_64.rpm hadoop/client/"
    # "hadoop_7_1_0_0-3.3.0.7.1.0-0.x86_64.rpm hadoop/lib/"
    # "zookeeper_7_1_0_0-3.5.8.7.1.0-0.noarch.rpm zookeeper/lib/"
    # "hadoop_7_1_0_0-hdfs-3.3.0.7.1.0-0.x86_64.rpm hadoop-hdfs/lib/"
    # "hadoop_7_1_0_0-yarn-3.3.0.7.1.0-0.x86_64.rpm hadoop-yarn/lib/"
    # "tez_7_1_0_0-0.10.2.7.1.0-0.noarch.rpm tez/lib/"
    # "ranger_7_1_0_0-elasticsearch-plugin-2.1.0.7.1.0-0.x86_64.rpm ranger-elasticsearch-plugin/install/lib/ ranger-elasticsearch-plugin/lib/ranger-elasticsearch-plugin/ranger-elasticsearch-plugin-impl/"
    # "kyuubi_7_1_0_0-3.3.2.7.1.0-0.noarch.rpm kyuubi/jars/ kyuubi/extension/"
    # "kafka_7_1_0_0-2.4.1.7.1.0-0.noarch.rpm kafka/libs/"
    # "ambari-server-2.7.3.0-139.x86_64.rpm usr/lib/ambari-server/"
    # "ambari-infra-solr-2.7.3.0-139.noarch.rpm usr/lib/ambari-infra-solr/server/lib/"
    # "ambari-logsearch-portal-2.7.3.0-139.noarch.rpm usr/lib/ambari-logsearch-portal/libs/"
)

#定义rpm目录
rpm_spec_dir="/root/rpmbuild/SPECS"
rpm_build_dir="/root/rpmbuild/BUILDROOT"
rpm_generator_dir="/root/rpmbuild/RPMS/x86_64"

#定义specs列表
spec_files=()

# 获取当前时间戳
timestamp=$(date +"%Y%m%d%H%M%S")

#创建打包的根目录
mkdir_root_dir() {
    # 获取给定目录的上级目录
    parent_directory="$(dirname "$rpm_package_dir")"
    # 在同级创建新目录（带时间戳）
    root_dir="${parent_directory}/jetty_root_${timestamp}"
    mkdir "${root_dir}"
}

#解压rpm包
extract_rpm_package() {
    local rpm_package="$1"
    rpm2cpio ${rpm_package} | cpio -idmv
    # echo "rpm包${rpm_package} 解压完成"
}

#创建一个文件夹以一个rpm包的名称为文件夹的名称
mkdir_rpm_name() {
    rpm_path="$1"
    # 获取文件名并去掉扩展名
    base_name=$(basename "$rpm_path" .rpm)
    cd ${root_dir}
    # 如果 base_name 包含 ".noarch"，则替换为 ".x86_64"
    if [[ $base_name == *".noarch"* ]]; then
    base_name=$(echo "$base_name" | sed 's/\.noarch/\.x86_64/')
    fi
    rpm_package_extract_directory="${root_dir}/${base_name}"
    mkdir "${rpm_package_extract_directory}"
    # 创建jars的备份目录
    rpm_package_jars_backup="${root_dir}/${base_name}_jars_backup"
    mkdir "${rpm_package_jars_backup}"
}

#获取spec文件
get_rpm_spec() {
   rpm_package="$1"
   spec_name="$2"
   rpmrebuild -ns "${rpm_package_extract_directory}.spec" --package ${rpm_package}
   echo "${rpm_package}的spec文件已经生成到${rpm_package_extract_directory}.spec"
}

#生成新的rpm包
#spec的名称和解压rpm的包是一个名称
get_packages_and_specs() {
    # rpm的绝对路径
    rpm_path="$1"
    # spec的名称
    mkdir_rpm_name $rpm_path
    cd "${rpm_package_extract_directory}"
    extract_rpm_package "$1"
    get_rpm_spec "$1" "$rpm_package_extract_directory"
}

#开始打包
start_packaging () {
    rpmbuild -bb "${rpm_package_extract_directory}.spec"
    echo "${rpm_package_extract_directory}打包完成"
}

#进行升级
upgrade_rpms() {
    upgrade_jars_and_specs "$1"
    copy_packages
}

#升级jars
upgrade_jars_and_specs() {
    local jars_dir="$1"
    local spec_dir="${jars_dir}"
    local new_link_name=""
    echo "$1" "$rpm_package_extract_directory"
    if [[ ! "$1" == "usr"* ]]; then
        jars_dir="$jetty_prefix_path$jars_dir"
        spec_dir="${jars_dir}"
    fi
    jars_dir="$rpm_package_extract_directory/${jars_dir}"
    echo "--------------------------------------------------------------"
    echo "${jars_dir}"
    echo "---------------------------------------------------------------"
    # 查找当前目录下所有以"jetty-"开头的jar包
    find ${jars_dir} -maxdepth 1 -type f -name "jetty-*.jar" | while read -r jar_file; do
        # 获取文件名（不包含路径）
        base_file=$(basename "$jar_file")

        # 提取"jetty-"之后的部分，即获取名称
        name=$(echo "$base_file" | sed -n 's/jetty-\(.*\)-9\.4\..*\.jar/\1/p')
        # 移动匹配到的jar包到指定文件夹
        mv "$jar_file" "$rpm_package_jars_backup/"

        # 在另一个文件夹中查找以提取到的名称开头的jar
        corresponding_file=$(find "$jetty_upgrade_jars_dir" -maxdepth 1 -type f -name "jetty-$name-*.jar" -print -quit)
        new_jar_name=$(basename "$corresponding_file")

        # sed -i "s/${spec_dir}${base_file}/${spec_dir}${new_jar_name}/" "${rpm_package_extract_directory}.spec"
        sed -i "s#${spec_dir}${base_file}#${spec_dir}${new_jar_name}#" "${rpm_package_extract_directory}.spec"
        # 检查是否存在对应的文件，存在则移动
        if [ -f "$corresponding_file" ]; then
            cp -rf "$corresponding_file" "$jars_dir/"
            echo "cp corresponding file: $corresponding_file"
        fi
    done

    # 寻找符合模式的软链接
    find "${jars_dir}" -maxdepth 1 -type l -name "jetty-*.jar" | while read -r link; do
        # 获取软链接的文件名（不包含路径）
        link_base=$(basename "$link")

        # 提取软链接中的名称部分
        # link_name=$(echo "$link_base" | sed -n 's/jetty-\(.*\)-\..*\.jar/\1/p')
        # link_name=$(echo "$link_base" | sed -n 's/jetty-\(.*\)-\?9\.4\..*\.jar/\1/p')
        # link_name=$(echo "$link_base" | sed -n 's/jetty-\(.*\)-\?\([0-9]\+\.[0-9]\+\.\)\?[^.]*\.jar/\1/p')
        # link_name=$(echo "$link_base" | sed -n 's/jetty-\(.*\)\.jar/\1/p')
        if [[ "$link_base" =~ -[0-9]+\.[0-9]+\. ]]; then
            link_name=$(echo "$link_base" | sed -n 's/jetty-\(.*\)-9\.4\..*\.jar/\1/p')
        else
            link_name=(echo "$link_base" | sed 's/jetty-\(.*\)\.jar/\1/')
        fi 

        # 在指定目录中查找目标文件
        target_file=$(find "$jetty_upgrade_jars_dir" -maxdepth 1 -type f -name "jetty-$link_name-*.jar" -print -quit)
        echo "---------------------------------66666666666----------------"
        echo "---------target_file------$target_file"
        echo "---------------------------------6666666666666----------------"
        new_spec_link_name=$(basename "$target_file")
       
        # 如果找到目标文件，进行操作
        # if [ -n "$target_file" ]; then
            # 获取原软链接的相对路径
            link_relative_path=$(readlink  "$link")
            # 提取相对路径中的目录部分
            link_relative_dir=$(dirname "$link_relative_path")
            # 构造新的软链接相对路径
            new_link_relative_path="$link_relative_dir/$(basename "$target_file")"
            
            echo "---------------------------------1234566----------------"
            echo "---------new_link_relative_path------$new_link_relative_path"
            echo "---------------------------------1234566----------------"
            
            # 移动旧软链接到指定目录
            mv "$link" "$rpm_package_jars_backup/"
            if [[ "$link_base" =~ -[0-9]+\.[0-9]+\. ]]; then
                new_link_name=$(basename "$target_file")
                sed -i "s#${spec_dir}${link_base}#${spec_dir}${new_spec_link_name}#" "${rpm_package_extract_directory}.spec"
            else
                new_link_name="$link_base"
            fi
            # 在目标目录中创建新的软链接（保留原相对路径，只替换版本号）
            ln -s "$new_link_relative_path" "$jars_dir/$new_link_name"

            echo "Moved and updated link: $link"
        # else
        #     echo "Target file not found for link: $link"
        # fi
    done
}

#移动打包文件
copy_packages() {
    cp -rf "${rpm_package_extract_directory}" "${rpm_build_dir}";
    echo "移动${rpm_package_extract_directory} 到打包目录 ${rpm_build_dir}"
}

#最终存放打好的包
# copy_rpms_to_target_dir() {
#     mkdir_target_dir
#     cd ${rpm_generator_dir}
#     for file in "${spec_files[@]}"; do
#        file_name=$(basename "$file" .spec)
#        mv "${file_name}.rpm" ${target_dir}
#     done
#     echo "所有更新的rpm包均已放置到目标目录：${target_dir}"
# }



#主逻辑
main() {
    mkdir_root_dir
    cd ${root_dir}
    echo "$(pwd)"
    echo "${root_dir}"
    # 遍历数组
    for row in "${rpms_map_to_jetty_path[@]}"; do
        # 初始化列计数器
        column=1
        for element in $row; do
            # 输出每个元素，只有当列计数器为1时才输出
            if [ $column -eq 1 ]; then
                get_packages_and_specs "$jetty_upgrade_rpms_dir$element"
            else 
                upgrade_rpms "$element"
            fi
            # 增加列计数器
           ((column++))
        done
        start_packaging
        echo "-------------------------------------------"
        echo "$element  打包完成"
        echo "-------------------------------------------"
    done
    echo "所有包升级成功"
}

main

echo "jetty升级完成"


