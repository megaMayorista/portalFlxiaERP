package net.flxia.portal.config;

import net.flxia.portal.sesion.SesionActual;
import net.flxia.portal.sesion.SesionInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.MethodParameter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class ConfiguracionWeb implements WebMvcConfigurer {

    private final SesionInterceptor sessionInterceptor;

    public ConfiguracionWeb(SesionInterceptor sessionInterceptor) {
        this.sessionInterceptor = sessionInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(sessionInterceptor).addPathPatterns("/api/**");
    }

    /** Controllers receive the logged-in person as a {@link SesionActual} parameter. */
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType() == SesionActual.class;
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer container,
                                          NativeWebRequest request, WebDataBinderFactory binderFactory) {
                Object session = request.getAttribute(SesionActual.ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
                if (session == null) {
                    throw ErrorPortal.unauthorized("Su sesión terminó. Ingrese de nuevo.");
                }
                return session;
            }
        });
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}
